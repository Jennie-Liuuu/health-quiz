import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateHealthMetrics } from '../utils/algorithm';

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
      return res.status(404).json({ error: '用户不存在' });
    }

    if (!user.age || !user.height || !user.weight || !user.targetWeight) {
      return res.status(400).json({ error: '数据不完整，请完成所有步骤' });
    }

    const result = calculateHealthMetrics({
      age: user.age,
      height: user.height,
      weight: user.weight,
      targetWeight: user.targetWeight,
      gender: user.gender || 'female',
    });

    await prisma.user.update({
      where: { sessionId },
      data: {
        bmi: result.bmi,
        dailyCalories: result.dailyCalories,
        targetDate: result.targetDate,
      },
    });

    const isSubscribed = user.subscriptionStatus === 'active';

    if (isSubscribed) {
      res.json({
        isSubscribed: true,
        data: {
          bmi: result.bmi,
          dailyCalories: result.dailyCalories,
          targetDate: result.targetDate.toISOString(),
          weight: user.weight,
          targetWeight: user.targetWeight,
          weeklyPlan: '个性化运动计划（会员专属）',
        }
      });
    } else {
      res.json({
        isSubscribed: false,
        data: {
          bmi: result.bmi,
          message: '订阅解锁完整数据，包括目标日期和个性化计划',
        },
        upgradePrompt: '升级到会员查看完整结果'
      });
    }
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;