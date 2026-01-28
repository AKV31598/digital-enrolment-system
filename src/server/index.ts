import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index.js';
import { createContext } from './context.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Must be BEFORE other middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// tRPC API
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log(' Digital Enrolment System Server Started');
  console.log('='.repeat(60));
  console.log(`   Server URL:     http://localhost:${PORT}`);
  console.log(`   API Endpoint:   http://localhost:${PORT}/api/trpc`);
  console.log('');
  console.log(' Test Credentials:');
  console.log('   HR Manager:  hr_admin / password123');
  console.log('   Employee:    john.doe / password123');
  console.log('');
});

export default app;
