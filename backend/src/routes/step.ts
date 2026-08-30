import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/step/gender - 保存性别和目标
router.post('/gender', async (req: Request, res: Response) => {
  try {
    console.log('📥 POST /api/step/gender - Request body:', req.body);

    const { gender, goal, sessionId } = req.body;

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      console.log('❌ 无效的性别:', gender);
      return res.status(400).json({ error: '无效的性别' });
    }

    if (!goal || !['lose_weight', 'build_muscle', 'keep_fit'].includes(goal)) {
      console.log('❌ 无效的目标:', goal);
      return res.status(400).json({ error: '无效的目标' });
    }

    const finalSessionId = sessionId || uuidv4();
    console.log('🔑 使用 sessionId:', finalSessionId);

    const user = await prisma.user.upsert({
      where: { sessionId: finalSessionId },
      update: { gender, goal },
      create: { sessionId: finalSessionId, gender, goal },
    });

    console.log('✅ 用户保存成功:', user.id);
    res.json({ sessionId: user.sessionId, message: 'Step 1 saved' });
  } catch (error) {
    console.error('❌ POST /api/step/gender 错误:', error);
    // 输出更详细的错误信息
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/step/body - 保存身体数据
router.post('/body', async (req: Request, res: Response) => {
  try {
    console.log('📥 POST /api/step/body - Request body:', req.body);

    const { sessionId, age, height, weight, targetWeight } = req.body;

    if (!sessionId) {
      console.log('❌ 缺少 sessionId');
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    if (age < 10 || age > 120) {
      console.log('❌ 无效的年龄:', age);
      return res.status(400).json({ error: '年龄必须在10-120之间' });
    }
    if (height < 50 || height > 300) {
      console.log('❌ 无效的身高:', height);
      return res.status(400).json({ error: '身高必须在50-300cm之间' });
    }
    if (weight < 20 || weight > 500) {
      console.log('❌ 无效的体重:', weight);
      return res.status(400).json({ error: '体重必须在20-500kg之间' });
    }
    if (targetWeight < 20 || targetWeight > 500) {
      console.log('❌ 无效的目标体重:', targetWeight);
      return res.status(400).json({ error: '目标体重必须在20-500kg之间' });
    }

    console.log('🔑 更新用户 sessionId:', sessionId);
    const user = await prisma.user.update({
      where: { sessionId },
      data: { age, height, weight, targetWeight },
    });

    console.log('✅ 身体数据保存成功:', user.id);
    res.json({ message: 'Step 2 saved' });
  } catch (error) {
    console.error('❌ POST /api/step/body 错误:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/step/frequency - 保存运动频率
router.post('/frequency', async (req: Request, res: Response) => {
  try {
    console.log('📥 POST /api/step/frequency - Request body:', req.body);

    const { sessionId, frequency } = req.body;

    if (!sessionId) {
      console.log('❌ 缺少 sessionId');
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    if (!['1-2', '3-4', '5+'].includes(frequency)) {
      console.log('❌ 无效的运动频率:', frequency);
      return res.status(400).json({ error: '无效的运动频率' });
    }

    console.log('🔑 更新用户 sessionId:', sessionId);
    const user = await prisma.user.update({
      where: { sessionId },
      data: { frequency },
    });

    console.log('✅ 运动频率保存成功:', user.id);
    res.json({ message: 'Step 3 saved' });
  } catch (error) {
    console.error('❌ POST /api/step/frequency 错误:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;