import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import resultRoutes from './result';
import payRoutes from './pay';
import stepRoutes from './step';
import prisma from '../lib/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/result', resultRoutes);
app.use('/api/pay', payRoutes);
app.use('/api/step', stepRoutes);

describe('鉴权差异化返回测试', () => {
  let testSessionId: string;

  // 创建一个完整的用户数据用于测试
  beforeAll(async () => {
    // 先完成三步
    const step1 = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'lose_weight',
      });

    testSessionId = step1.body.sessionId;

    await request(app)
      .post('/api/step/body')
      .send({
        sessionId: testSessionId,
        age: 28,
        height: 165,
        weight: 65,
        targetWeight: 55,
      });

    await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: testSessionId,
        frequency: '3-4',
      });
  });

  // ===== 非会员脱敏 =====
  it('非会员访问结果页应该返回脱敏数据（不包含 targetDate 和 weeklyPlan）', async () => {
    const res = await request(app)
      .get('/api/result')
      .set('x-session-id', testSessionId);

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(false);
    expect(res.body.data.bmi).toBeDefined();
    expect(res.body.data.message).toBeDefined();
    expect(res.body.upgradePrompt).toBeDefined();
    
    // 非会员不应该看到这些字段
    expect(res.body.data.dailyCalories).toBeUndefined();
    expect(res.body.data.targetDate).toBeUndefined();
    expect(res.body.data.weeklyPlan).toBeUndefined();
  });

  it('非会员应该看到升级提示', async () => {
    const res = await request(app)
      .get('/api/result')
      .set('x-session-id', testSessionId);

    expect(res.body.upgradePrompt).toBe('升级到会员查看完整结果');
  });

  // ===== 会员完整数据 =====
  it('支付后会员应该能看到完整数据', async () => {
    // 模拟支付
    const payRes = await request(app)
      .post('/api/pay')
      .send({
        sessionId: testSessionId,
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.subscriptionStatus).toBe('active');

    // 再次获取结果
    const resultRes = await request(app)
      .get('/api/result')
      .set('x-session-id', testSessionId);

    expect(resultRes.status).toBe(200);
    expect(resultRes.body.isSubscribed).toBe(true);
    
    // 会员能看到完整数据
    expect(resultRes.body.data.bmi).toBeDefined();
    expect(resultRes.body.data.dailyCalories).toBeDefined();
    expect(resultRes.body.data.targetDate).toBeDefined();
    expect(resultRes.body.data.weeklyPlan).toBeDefined();
  });

  // ===== 支付后状态持久化 =====
  it('支付状态应该在数据库中持久化', async () => {
    const user = await prisma.user.findUnique({
      where: { sessionId: testSessionId },
    });

    expect(user?.subscriptionStatus).toBe('active');
  });

  // ===== 缺少 sessionId =====
  it('应该拒绝缺少 sessionId 的请求', async () => {
    const res = await request(app)
      .get('/api/result');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('缺少 sessionId');
  });

  // ===== 用户不存在 =====
  it('应该拒绝不存在的 sessionId', async () => {
    const res = await request(app)
      .get('/api/result')
      .set('x-session-id', 'non-existent-session-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('用户不存在');
  });

  // ===== 数据不完整 =====
  it('应该拒绝数据不完整的用户', async () => {
    // 创建一个只完成了第一步的用户
    const step1 = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'male',
        goal: 'build_muscle',
      });

    const incompleteSid = step1.body.sessionId;

    const res = await request(app)
      .get('/api/result')
      .set('x-session-id', incompleteSid);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('数据不完整，请完成所有步骤');
  });

  // ===== 确保非会员拿不到被保护字段 =====
  it('非会员即使尝试访问也无法获取被保护字段（结构化验证）', async () => {
    // 创建一个新的非会员用户
    const step1 = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'lose_weight',
      });

    const newSid = step1.body.sessionId;

    await request(app)
      .post('/api/step/body')
      .send({
        sessionId: newSid,
        age: 30,
        height: 170,
        weight: 70,
        targetWeight: 60,
      });

    await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: newSid,
        frequency: '1-2',
      });

    const res = await request(app)
      .get('/api/result')
      .set('x-session-id', newSid);

    expect(res.status).toBe(200);
    expect(res.body.isSubscribed).toBe(false);
    
    // 明确验证被保护字段不存在
    const data = res.body.data;
    expect(data.dailyCalories).toBeUndefined();
    expect(data.targetDate).toBeUndefined();
    expect(data.weeklyPlan).toBeUndefined();
    
    // 但有脱敏数据
    expect(data.bmi).toBeDefined();
    expect(data.message).toBeDefined();
  });
});