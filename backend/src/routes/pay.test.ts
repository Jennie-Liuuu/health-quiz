import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import payRoutes from './pay';
import stepRoutes from './step';
import resultRoutes from './result';
import prisma from '../lib/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/pay', payRoutes);
app.use('/api/step', stepRoutes);
app.use('/api/result', resultRoutes);

describe('支付回调 + 端到端验证', () => {
  let testSessionId: string;

  // 创建一个完整的用户数据用于测试
  beforeAll(async () => {
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

  // ===== 正常支付 =====
  it('应该成功完成支付并更新会员状态', async () => {
    const res = await request(app)
      .post('/api/pay')
      .send({
        sessionId: testSessionId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('支付成功，已开通会员');
    expect(res.body.subscriptionStatus).toBe('active');

    // 验证数据库中的状态
    const user = await prisma.user.findUnique({
      where: { sessionId: testSessionId },
    });

    expect(user?.subscriptionStatus).toBe('active');
  });

  // ===== 支付后结果页从脱敏变为完整 =====
  it('支付后结果页返回从"脱敏"变为"完整"', async () => {
    // 先确保用户是非会员状态
    // 创建一个新用户
    const step1 = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'male',
        goal: 'build_muscle',
      });

    const newSid = step1.body.sessionId;

    await request(app)
      .post('/api/step/body')
      .send({
        sessionId: newSid,
        age: 30,
        height: 180,
        weight: 75,
        targetWeight: 80,
      });

    await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: newSid,
        frequency: '5+',
      });

    // 支付前：脱敏
    const beforePay = await request(app)
      .get('/api/result')
      .set('x-session-id', newSid);

    expect(beforePay.body.isSubscribed).toBe(false);
    expect(beforePay.body.data.dailyCalories).toBeUndefined();
    expect(beforePay.body.data.targetDate).toBeUndefined();

    // 执行支付
    await request(app)
      .post('/api/pay')
      .send({
        sessionId: newSid,
      });

    // 支付后：完整
    const afterPay = await request(app)
      .get('/api/result')
      .set('x-session-id', newSid);

    expect(afterPay.body.isSubscribed).toBe(true);
    expect(afterPay.body.data.dailyCalories).toBeDefined();
    expect(afterPay.body.data.targetDate).toBeDefined();
    expect(afterPay.body.data.weeklyPlan).toBeDefined();
  });

  // ===== 缺少 sessionId =====
  it('应该拒绝缺少 sessionId 的支付请求', async () => {
    const res = await request(app)
      .post('/api/pay')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('缺少 sessionId');
  });

  // ===== 用户不存在 =====
  it('应该拒绝不存在的 sessionId', async () => {
    const res = await request(app)
      .post('/api/pay')
      .send({
        sessionId: 'non-existent-session-id',
      });

    expect(res.status).toBe(500); // Prisma 会抛出错误
  });

  // ===== 重复支付 =====
  it('应该支持重复支付（状态保持 active）', async () => {
    // 创建新用户
    const step1 = await request(app)
      .post('/api/step/gender')
      .send({
        gender: 'female',
        goal: 'keep_fit',
      });

    const newSid = step1.body.sessionId;

    await request(app)
      .post('/api/step/body')
      .send({
        sessionId: newSid,
        age: 25,
        height: 160,
        weight: 55,
        targetWeight: 52,
      });

    await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: newSid,
        frequency: '1-2',
      });

    // 第一次支付
    const pay1 = await request(app)
      .post('/api/pay')
      .send({ sessionId: newSid });

    expect(pay1.body.subscriptionStatus).toBe('active');

    // 第二次支付（重复）
    const pay2 = await request(app)
      .post('/api/pay')
      .send({ sessionId: newSid });

    expect(pay2.status).toBe(200);
    expect(pay2.body.subscriptionStatus).toBe('active');
  });

  // ===== 支付后数据完整性 =====
  it('支付后所有必要字段应该完整', async () => {
    // 创建新用户
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
        age: 28,
        height: 165,
        weight: 65,
        targetWeight: 55,
      });

    await request(app)
      .post('/api/step/frequency')
      .send({
        sessionId: newSid,
        frequency: '3-4',
      });

    // 支付
    await request(app)
      .post('/api/pay')
      .send({ sessionId: newSid });

    // 获取结果
    const res = await request(app)
      .get('/api/result')
      .set('x-session-id', newSid);

    expect(res.body.data).toHaveProperty('bmi');
    expect(res.body.data).toHaveProperty('dailyCalories');
    expect(res.body.data).toHaveProperty('targetDate');
    expect(res.body.data).toHaveProperty('weeklyPlan');
    expect(res.body.data.dailyCalories).toBeGreaterThan(0);
  });
});