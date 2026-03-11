import { Router, Response } from 'express';
import * as repo from '../database/repository';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import * as aiService from '../services/ai-service';

const router = Router();
router.use(verifyAuth);

const p = (v: string | string[]): string => Array.isArray(v) ? v[0] : v;

// GET /api/cases/:caseId/chat
router.get('/:caseId/chat', (req: AuthRequest, res: Response) => {
  const caseId = p(req.params.caseId);
  const caseInfo = repo.getCaseById(caseId);
  if (!caseInfo || caseInfo.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const messages = repo.getMessages(caseId);
  res.json(messages);
});

// POST /api/cases/:caseId/chat
router.post('/:caseId/chat', async (req: AuthRequest, res: Response) => {
  const caseId = p(req.params.caseId);
  const caseInfo = repo.getCaseById(caseId);
  if (!caseInfo || caseInfo.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  if (!aiService.isConfigured()) {
    res.status(503).json({ error: 'AI service not configured. Set OPENAI_API_KEY environment variable.' });
    return;
  }
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }
  try {
    const reply = await aiService.chat(caseId, message);
    res.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat failed';
    res.status(500).json({ error: msg });
  }
});

export default router;
