import { Router, Response } from 'express';
import * as repo from '../database/repository';
import { verifyAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyAuth);

const p = (v: string | string[]): string => Array.isArray(v) ? v[0] : v;

// GET /api/cases
router.get('/', (req: AuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const cases = repo.getCases(req.userId!, search);
  // Add stats for each case
  const result = cases.map(c => ({
    ...c,
    stats: repo.getCaseStats(c.id)
  }));
  res.json(result);
});

// POST /api/cases
router.post('/', (req: AuthRequest, res: Response) => {
  const c = repo.createCase(req.userId!, req.body);
  res.status(201).json(c);
});

// GET /api/cases/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const c = repo.getCaseById(p(req.params.id));
  if (!c || c.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  res.json({ ...c, stats: repo.getCaseStats(c.id) });
});

// PUT /api/cases/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const existing = repo.getCaseById(p(req.params.id));
  if (!existing || existing.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const updated = repo.updateCase(p(req.params.id), req.body);
  res.json(updated);
});

// DELETE /api/cases/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const existing = repo.getCaseById(p(req.params.id));
  if (!existing || existing.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  repo.deleteCase(p(req.params.id));
  res.json({ success: true });
});

export default router;
