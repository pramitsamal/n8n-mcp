import { Router, Response } from 'express';
import * as repo from '../database/repository';
import { verifyAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyAuth);

const p = (v: string | string[]): string => Array.isArray(v) ? v[0] : v;

// GET /api/cases/:caseId/timeline
router.get('/:caseId/timeline', (req: AuthRequest, res: Response) => {
  const caseId = p(req.params.caseId);
  const caseInfo = repo.getCaseById(caseId);
  if (!caseInfo || caseInfo.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const events = repo.getTimelineEvents(caseId);
  res.json(events);
});

// POST /api/cases/:caseId/timeline
router.post('/:caseId/timeline', (req: AuthRequest, res: Response) => {
  const caseId = p(req.params.caseId);
  const caseInfo = repo.getCaseById(caseId);
  if (!caseInfo || caseInfo.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const event = repo.createTimelineEvent(caseId, req.body);
  res.status(201).json(event);
});

// DELETE /api/timeline/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  repo.deleteTimelineEvent(p(req.params.id));
  res.json({ success: true });
});

export default router;
