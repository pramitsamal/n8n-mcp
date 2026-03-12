import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import * as repo from '../database/repository';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import * as aiService from '../services/ai-service';
import { extractText } from '../services/text-extractor';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'data', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

const router = Router();
router.use(verifyAuth);

const p = (v: string | string[]): string => Array.isArray(v) ? v[0] : v;

// POST /api/cases/:caseId/documents
router.post('/cases/:caseId/documents', upload.single('file'), async (req: AuthRequest, res: Response) => {
  const caseId = p(req.params.caseId);
  const caseInfo = repo.getCaseById(caseId);
  if (!caseInfo || caseInfo.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  // Use client-provided OCR text (images), or extract server-side (PDF/DOCX/TXT)
  let ocrText = req.body.ocr_text || null;
  if (!ocrText) {
    ocrText = await extractText(
      path.join(UPLOADS_DIR, req.file.filename),
      req.file.mimetype
    );
  }

  const doc = repo.createDocument(caseId, {
    filename: req.file.originalname,
    doc_type: (req.body.doc_type as string) || 'other',
    ocr_text: ocrText,
    file_path: req.file.filename,
    file_size: req.file.size,
    mime_type: req.file.mimetype
  });

  repo.createTimelineEvent(caseId, {
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'filing',
    title: `Document uploaded: ${req.file.originalname}`,
    document_id: doc.id
  });

  res.status(201).json(doc);
});

// GET /api/cases/:caseId/documents
router.get('/cases/:caseId/documents', (req: AuthRequest, res: Response) => {
  const caseId = p(req.params.caseId);
  const caseInfo = repo.getCaseById(caseId);
  if (!caseInfo || caseInfo.user_id !== req.userId) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const docs = repo.getDocuments(caseId);
  res.json(docs);
});

// GET /api/documents/:id
router.get('/documents/:id', (req: AuthRequest, res: Response) => {
  const doc = repo.getDocumentById(p(req.params.id));
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  const caseInfo = repo.getCaseById(doc.case_id);
  if (!caseInfo || caseInfo.user_id !== req.userId) { res.status(404).json({ error: 'Document not found' }); return; }
  res.json(doc);
});

// GET /api/documents/:id/file
router.get('/documents/:id/file', (req: AuthRequest, res: Response) => {
  const doc = repo.getDocumentById(p(req.params.id));
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  const caseInfo = repo.getCaseById(doc.case_id);
  if (!caseInfo || caseInfo.user_id !== req.userId) { res.status(404).json({ error: 'Document not found' }); return; }
  const filePath = path.join(UPLOADS_DIR, doc.file_path);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found on disk' }); return; }
  res.sendFile(filePath);
});

// POST /api/documents/:id/analyze
router.post('/documents/:id/analyze', async (req: AuthRequest, res: Response) => {
  const docId = p(req.params.id);
  const doc = repo.getDocumentById(docId);
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  const caseInfo = repo.getCaseById(doc.case_id);
  if (!caseInfo || caseInfo.user_id !== req.userId) { res.status(404).json({ error: 'Document not found' }); return; }
  if (!aiService.isConfigured()) { res.status(503).json({ error: 'AI service not configured. Set OPENAI_API_KEY environment variable.' }); return; }
  if (!doc.ocr_text) { res.status(400).json({ error: 'Document has no text content. Please upload OCR text first.' }); return; }
  try {
    const analysis = await aiService.analyzeDocument(docId);
    res.json({ analysis: JSON.parse(analysis) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    res.status(500).json({ error: message });
  }
});

// POST /api/documents/:id/extract - Re-extract text from existing document
router.post('/documents/:id/extract', async (req: AuthRequest, res: Response) => {
  const docId = p(req.params.id);
  const doc = repo.getDocumentById(docId);
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  const caseInfo = repo.getCaseById(doc.case_id);
  if (!caseInfo || caseInfo.user_id !== req.userId) { res.status(404).json({ error: 'Document not found' }); return; }
  const filePath = path.join(UPLOADS_DIR, doc.file_path);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found on disk' }); return; }
  try {
    const ocrText = await extractText(filePath, doc.mime_type || '');
    if (ocrText) {
      repo.updateDocument(docId, { ocr_text: ocrText });
      res.json({ success: true, ocr_text: ocrText });
    } else {
      res.status(422).json({ error: 'Could not extract text from this file type' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    res.status(500).json({ error: message });
  }
});

// PUT /api/documents/:id
router.put('/documents/:id', (req: AuthRequest, res: Response) => {
  const docId = p(req.params.id);
  const doc = repo.getDocumentById(docId);
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  const caseInfo = repo.getCaseById(doc.case_id);
  if (!caseInfo || caseInfo.user_id !== req.userId) { res.status(404).json({ error: 'Document not found' }); return; }
  repo.updateDocument(docId, req.body);
  res.json(repo.getDocumentById(docId));
});

// DELETE /api/documents/:id
router.delete('/documents/:id', (req: AuthRequest, res: Response) => {
  const docId = p(req.params.id);
  const doc = repo.getDocumentById(docId);
  if (!doc) { res.status(404).json({ error: 'Document not found' }); return; }
  const caseInfo = repo.getCaseById(doc.case_id);
  if (!caseInfo || caseInfo.user_id !== req.userId) { res.status(404).json({ error: 'Document not found' }); return; }
  const filePath = path.join(UPLOADS_DIR, doc.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  repo.deleteDocument(docId);
  res.json({ success: true });
});

export default router;
