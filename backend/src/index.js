import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isMongoConnected } from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongoDbConnected: isMongoConnected(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api', chatRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error occurred.' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 [AI Chat Assistant Server] Running on http://localhost:${PORT}`);
    console.log(`📡 [Health Check] http://localhost:${PORT}/api/health`);
  });
};

startServer();
