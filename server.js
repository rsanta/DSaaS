import express from 'express';
import dotenv from 'dotenv';
import deepSearchRouter from './routes/deepSearch.js';
import { initializeFirebase } from './config/firebase.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize Firebase
try {
  initializeFirebase();
  console.log('Firebase connection established');
} catch (error) {
  console.error('Failed to initialize Firebase:', error.message);
  process.exit(1);
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'DeepSearch as a Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'DeepSearch as a Service',
    description: 'Semantic search service using OpenAI and Firebase',
    endpoints: {
      health: 'GET /health',
      search: 'GET /deepsearch?query=<your_query>',
      searchPost: 'POST /deepsearch'
    },
    example: `curl "http://localhost:${PORT}/deepsearch?query=sostenibilidad"`
  });
});

app.use('/deepsearch', deepSearchRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: ['GET /', 'GET /health', 'GET /deepsearch', 'POST /deepsearch']
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('DeepSearch as a Service (DSaaS)');
  console.log('========================================\n');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Search endpoint: http://localhost:${PORT}/deepsearch?query=...\n`);
  console.log('Example usage:');
  console.log(`  curl "http://localhost:${PORT}/deepsearch?query=sostenibilidad"\n`);
  console.log('Press CTRL+C to stop\n');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n\nSIGINT signal received: closing HTTP server');
  console.log('Server stopped\n');
  process.exit(0);
});

export default app;