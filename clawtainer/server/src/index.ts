import express from 'express';
import cors from 'cors';
import path from 'path';
import { getDb, closeDb } from './database/db';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import documentRoutes from './routes/documents';
import timelineRoutes from './routes/timeline';
import aiRoutes from './routes/ai';

const app = express();
const PORT = parseInt(process.env.PORT || '3741', 10);

// Initialize database
getDb();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api', documentRoutes);  // Has /cases/:id/documents and /documents/:id
app.use('/api/cases', timelineRoutes);  // Has /:caseId/timeline
app.use('/api/cases', aiRoutes);  // Has /:caseId/chat

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve client in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clawtainer server running on http://0.0.0.0:${PORT}`);
  console.log(`AI configured: ${!!process.env.OPENAI_API_KEY}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { closeDb(); process.exit(0); });
process.on('SIGINT', () => { closeDb(); process.exit(0); });
