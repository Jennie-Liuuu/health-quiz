import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    const user = await prisma.user.update({
      where: { sessionId },
      data: { subscriptionStatus: 'active' },
    });

    res.json({
      success: true,
      message: '支付成功，已开通会员',
      subscriptionStatus: user.subscriptionStatus
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;