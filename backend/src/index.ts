import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import stepRoutes from './routes/step';
import progressRoutes from './routes/progress';
import resultRoutes from './routes/result';
import payRoutes from './routes/pay';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 明确允许的域名列表
const allowedOrigins = [
  'http://localhost:5173',           // 本地 Vite 开发
  'http://localhost:3000',           // 本地 Next.js 开发
  'https://health-quiz.edgeone.dev', // EdgeOne 生产环境
  'https://health-quiz-lake.vercel.app', // Vercel 备用地址
];

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（如 Postman、curl）
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`❌ CORS 拒绝: ${origin}`);
      return callback(new Error('CORS 不允许此来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-session-id'],
}));

app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/step', stepRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/pay', payRoutes);

// 错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ 错误:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});