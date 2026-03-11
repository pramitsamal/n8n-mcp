import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as repo from '../database/repository';
import { generateToken, verifyAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/setup - Initial setup (create first user)
router.post('/setup', async (req: Request, res: Response) => {
  const existing = repo.getFirstUser();
  if (existing) {
    res.status(400).json({ error: 'Setup already completed. Use /login instead.' });
    return;
  }
  const { name, pin } = req.body;
  if (!name || !pin || pin.length < 4) {
    res.status(400).json({ error: 'Name and PIN (min 4 digits) are required' });
    return;
  }
  const hash = await bcrypt.hash(pin, 12);
  const user = repo.createUser(name, hash);
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name } });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { pin } = req.body;
  const user = repo.getFirstUser();
  if (!user) {
    res.status(400).json({ error: 'No account set up. Use /setup first.' });
    return;
  }
  const valid = await bcrypt.compare(pin, user.pin_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid PIN' });
    return;
  }
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name } });
});

// POST /api/auth/change-pin
router.post('/change-pin', verifyAuth, async (req: AuthRequest, res: Response) => {
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin || newPin.length < 4) {
    res.status(400).json({ error: 'Current PIN and new PIN (min 4 digits) required' });
    return;
  }
  const user = repo.getFirstUser();
  if (!user) {
    res.status(400).json({ error: 'No account found' });
    return;
  }
  const valid = await bcrypt.compare(currentPin, user.pin_hash);
  if (!valid) {
    res.status(401).json({ error: 'Current PIN is incorrect' });
    return;
  }
  const hash = await bcrypt.hash(newPin, 12);
  repo.updateUserPin(user.id, hash);
  res.json({ success: true });
});

// GET /api/auth/status - Check if setup is needed
router.get('/status', (_req: Request, res: Response) => {
  const user = repo.getFirstUser();
  res.json({ setupRequired: !user, userName: user?.name || null });
});

export default router;
