import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/step/gender - 保存性别和目标
router.post('/gender', async (req: Request, res: Response) => {
  try {
    const { gender, goal, sessionId } = req.body;

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ error: '无效的性别' });
    }

    if (!goal || !['lose_weight', 'build_muscle', 'keep_fit'].includes(goal)) {
      return res.status(400).json({ error: '无效的目标' });
    }

    const finalSessionId = sessionId || uuidv4();

    const user = await prisma.user.upsert({
      where: { sessionId: finalSessionId },
      update: { gender, goal },
      create: { sessionId: finalSessionId, gender, goal },
    });

    res.json({ sessionId: user.sessionId, message: 'Step 1 saved' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/step/body - 保存身体数据
router.post('/body', async (req: Request, res: Response) => {
  try {
    const { sessionId, age, height, weight, targetWeight } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    if (age < 10 || age > 120) {
      return res.status(400).json({ error: '年龄必须在10-120之间' });
    }
    if (height < 50 || height > 300) {
      return res.status(400).json({ error: '身高必须在50-300cm之间' });
    }
    if (weight < 20 || weight > 500) {
      return res.status(400).json({ error: '体重必须在20-500kg之间' });
    }
    if (targetWeight < 20 || targetWeight > 500) {
      return res.status(400).json({ error: '目标体重必须在20-500kg之间' });
    }

    const user = await prisma.user.update({
      where: { sessionId },
      data: { age, height, weight, targetWeight },
    });

    res.json({ message: 'Step 2 saved' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/step/frequency - 保存运动频率
router.post('/frequency', async (req: Request, res: Response) => {
  try {
    const { sessionId, frequency } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    if (!['1-2', '3-4', '5+'].includes(frequency)) {
      return res.status(400).json({ error: '无效的运动频率' });
    }

    const user = await prisma.user.update({
      where: { sessionId },
      data: { frequency },
    });

    res.json({ message: 'Step 3 saved' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;