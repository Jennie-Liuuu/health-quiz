import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    const user = await prisma.user.findUnique({
      where: { sessionId }
    });

    if (!user) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      step1_completed: !!(user.gender && user.goal),
      step2_completed: !!(user.age && user.height && user.weight && user.targetWeight),
      step3_completed: !!user.frequency,
      data: {
        gender: user.gender,
        goal: user.goal,
        age: user.age,
        height: user.height,
        weight: user.weight,
        targetWeight: user.targetWeight,
        frequency: user.frequency,
      }
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;