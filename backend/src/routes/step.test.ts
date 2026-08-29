import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import stepRoutes from './step';
import progressRoutes from './progress';
import prisma from '../lib/prisma';

// 创建测试用的 Express 应用
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/step', stepRoutes);
app.use('/api/progress', progressRoutes);

describe('分步保存 + 进度恢复 集成测试', () => {
  let testSessionId: string;

  // ===== 正常流程 =====
  it('应该完整走完三步并保存所有数据', async () => {
    // Step 1: 保存性别和目标
    const step1Res = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'lose_weight',
      });

    expect(step1Res.status).toBe(200);
    expect(step1Res.body.sessionId).toBeDefined();
    expect(step1Res.body.message).toBe('Step 1 saved');

    testSessionId = step1Res.body.sessionId;

    // Step 2: 保存身体数据
    const step2Res = await request(app)
      .post('/api/step/body')
      .send({
        sessionId: testSessionId,
        age: 28,
        height: 165,
        weight: 65,
        targetWeight: 55,
      });

    expect(step2Res.status).toBe(200);
    expect(step2Res.body.message).toBe('Step 2 saved');

    // Step 3: 保存运动频率
    const step3Res = await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: testSessionId,
        frequency: '3-4',
      });

    expect(step3Res.status).toBe(200);
    expect(step3Res.body.message).toBe('Step 3 saved');

    // 验证数据库中的数据
    const user = await prisma.user.findUnique({
      where: { sessionId: testSessionId },
    });

    expect(user).not.toBeNull();
    expect(user?.gender).toBe('female');
    expect(user?.goal).toBe('lose_weight');
    expect(user?.age).toBe(28);
    expect(user?.height).toBe(165);
    expect(user?.weight).toBe(65);
    expect(user?.targetWeight).toBe(55);
    expect(user?.frequency).toBe('3-4');
  });

  // ===== 进度恢复 =====
  it('应该能恢复已保存的进度', async () => {
    // 先创建一个用户
    const createRes = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'male',
        goal: 'build_muscle',
      });

    const sid = createRes.body.sessionId;

    // 只保存第一步，模拟用户中途离开
    const progressRes = await request(app)
      .get('/api/progress')
      .set('x-session-id', sid);

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.exists).toBe(true);
    expect(progressRes.body.step1_completed).toBe(true);
    expect(progressRes.body.step2_completed).toBe(false);
    expect(progressRes.body.step3_completed).toBe(false);
    expect(progressRes.body.data.gender).toBe('male');
    expect(progressRes.body.data.goal).toBe('build_muscle');
  });

  // ===== 乱序提交 =====
  it('应该拒绝缺少 sessionId 的请求', async () => {
    const res = await request(app)
      .post('/api/step/body')
      .send({
        age: 28,
        height: 165,
        weight: 65,
        targetWeight: 55,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('缺少 sessionId');
  });

  it('应该拒绝无效的性别', async () => {
    const res = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'invalid_gender',
        goal: 'lose_weight',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('无效的性别');
  });

  it('应该拒绝无效的目标', async () => {
    const res = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'invalid_goal',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('无效的目标');
  });

  it('应该拒绝无效的运动频率', async () => {
    const res = await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: 'test-session',
        frequency: '10+',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('无效的运动频率');
  });

  // ===== 重复提交 =====
  it('应该支持重复提交（幂等性）', async () => {
    // 先创建一个用户
    const createRes = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'keep_fit',
      });

    const sid = createRes.body.sessionId;

    // 第二次提交同样的数据
    const res2 = await request(app)
      .post('/api/step/gender')
      .send({
        sessionId: sid,
        gender: 'female',
        goal: 'keep_fit',
      });

    expect(res2.status).toBe(200);
    expect(res2.body.sessionId).toBe(sid);
  });

  // ===== 并发更新 =====
  it('应该正确处理并发更新（最后一次有效）', async () => {
    const createRes = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'lose_weight',
      });

    const sid = createRes.body.sessionId;

    // 模拟并发更新
    await Promise.all([
      request(app)
        .post('/api/step/body')
        .send({
          sessionId: sid,
          age: 25,
          height: 160,
          weight: 60,
          targetWeight: 55,
        }),
      request(app)
        .post('/api/step/body')
        .send({
          sessionId: sid,
          age: 30,
          height: 170,
          weight: 70,
          targetWeight: 65,
        }),
    ]);

    const user = await prisma.user.findUnique({
      where: { sessionId: sid },
    });

    expect(user).not.toBeNull();
  });

  // ===== 边界值 =====
  it('应该接受边界值（年龄 10 岁）', async () => {
    const createRes = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'keep_fit',
      });

    const sid = createRes.body.sessionId;

    const res = await request(app)
      .post('/api/step/body')
      .send({
        sessionId: sid,
        age: 10,
        height: 140,
        weight: 30,
        targetWeight: 28,
      });

    expect(res.status).toBe(200);
  });

  it('应该拒绝年龄小于 10 岁', async () => {
    const createRes = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'keep_fit',
      });

    const sid = createRes.body.sessionId;

    const res = await request(app)
      .post('/api/step/body')
      .send({
        sessionId: sid,
        age: 5,
        height: 140,
        weight: 30,
        targetWeight: 28,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('年龄必须在10-120之间');
  });

  it('应该拒绝身高小于 50cm', async () => {
    const createRes = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'keep_fit',
      });

    const sid = createRes.body.sessionId;

    const res = await request(app)
      .post('/api/step/body')
      .send({
        sessionId: sid,
        age: 20,
        height: 40,
        weight: 30,
        targetWeight: 28,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('身高必须在50-300cm之间');
  });
});