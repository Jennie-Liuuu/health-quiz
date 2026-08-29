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

app.use(cors());
app.use(express.json());

app.use('/api/step', stepRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/pay', payRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});