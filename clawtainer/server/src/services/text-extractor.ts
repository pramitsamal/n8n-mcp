import fs from 'fs';
import path from 'path';

/**
 * Extract text from uploaded files (PDF, DOCX, TXT).
 * Returns null if extraction fails or file type is unsupported.
 */
export async function extractText(filePath: string, mimeType: string): Promise<string | null> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    // PDF
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const result = await pdfParse(buffer);
      const text = result.text?.trim();
      return text || null;
    }

    // DOCX
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === '.docx'
    ) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value?.trim();
      return text || null;
    }

    // Plain text
    if (mimeType === 'text/plain' || ext === '.txt') {
      const text = fs.readFileSync(filePath, 'utf-8').trim();
      return text || null;
    }

    // .doc (legacy binary) - not supported by mammoth
    // Images - handled by client-side OCR
    return null;
  } catch (error) {
    console.error('Text extraction failed:', error);
    return null;
  }
}
