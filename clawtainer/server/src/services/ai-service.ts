import OpenAI from 'openai';
import * as repo from '../database/repository';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT_ANALYSIS = `You are a legal document analysis assistant specializing in Indian family law.
You analyze legal documents and provide structured analysis.

When analyzing a document, provide a JSON response with these fields:
- case_nature: The type of family law matter (divorce, custody, maintenance, domestic violence, guardianship, etc.)
- relevant_sections: Array of applicable legal sections (Hindu Marriage Act, Special Marriage Act, DV Act, CrPC, IPC, Guardians and Wards Act, etc.)
- key_facts: Array of key facts extracted from the document
- strengths: Array of strengths in the position presented
- weaknesses: Array of weaknesses or vulnerabilities
- suggested_strategy: Brief strategic recommendation
- relevant_precedents: Array of potentially relevant Supreme Court/High Court precedents
- estimated_duration: Estimated case duration based on type and complexity
- summary: 2-3 paragraph summary of the document

Always respond with valid JSON only.`;

const SYSTEM_PROMPT_CHAT = `You are a legal research assistant specializing in Indian family law.
You help lawyers with:
- Answering legal questions about Indian family law
- Identifying relevant Supreme Court and High Court judgments
- Drafting structured legal arguments
- Analyzing case strategy
- Identifying legal risks and opportunities
- Drafting petitions, applications, affidavits, and replies in standard Indian court format

Key legislation you are knowledgeable about:
- Hindu Marriage Act, 1955
- Special Marriage Act, 1954
- Hindu Minority and Guardianship Act, 1956
- Guardians and Wards Act, 1890
- Protection of Women from Domestic Violence Act, 2005
- Hindu Adoption and Maintenance Act, 1956
- Family Courts Act, 1984
- Indian Divorce Act, 1869
- Muslim Personal Law (Shariat) Application Act, 1937
- Relevant sections of CrPC and IPC/BNS

You provide accurate, well-reasoned legal analysis. When citing precedents, mention case name, year, and court.
Always clarify that your responses are for research assistance and not formal legal advice.`;

export async function analyzeDocument(documentId: string): Promise<string> {
  const doc = repo.getDocumentById(documentId);
  if (!doc || !doc.ocr_text) {
    throw new Error('Document not found or has no text content');
  }

  const caseInfo = repo.getCaseById(doc.case_id);
  const caseContext = caseInfo
    ? `Case: ${caseInfo.title}, Type: ${caseInfo.case_type || 'unspecified'}, Court: ${caseInfo.court || 'unspecified'}, Role: ${caseInfo.lawyer_role || 'unspecified'}`
    : '';

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_ANALYSIS },
      { role: 'user', content: `${caseContext}\n\nDocument type: ${doc.doc_type}\nFilename: ${doc.filename}\n\nDocument text:\n${doc.ocr_text.slice(0, 30000)}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000
  });

  const analysis = response.choices[0]?.message?.content || '{}';

  // Parse to extract summary
  let summary = '';
  try {
    const parsed = JSON.parse(analysis);
    summary = parsed.summary || '';
  } catch { /* use raw */ }

  repo.updateDocument(documentId, { ai_analysis: analysis, ai_summary: summary });
  return analysis;
}

export async function chat(caseId: string, userMessage: string): Promise<string> {
  // Save user message
  repo.createMessage(caseId, 'user', userMessage);

  // Build context
  const caseInfo = repo.getCaseById(caseId);
  const docs = repo.getDocuments(caseId);
  const history = repo.getMessages(caseId, 20);

  let caseContext = '';
  if (caseInfo) {
    caseContext = `\n\nCurrent case context:\n- Title: ${caseInfo.title}\n- Case Number: ${caseInfo.case_number || 'N/A'}\n- Court: ${caseInfo.court || 'N/A'}\n- Type: ${caseInfo.case_type || 'N/A'}\n- Status: ${caseInfo.status}\n- Petitioner: ${caseInfo.petitioner || 'N/A'}\n- Respondent: ${caseInfo.respondent || 'N/A'}\n- Lawyer Role: ${caseInfo.lawyer_role || 'N/A'}`;
  }

  if (docs.length > 0) {
    caseContext += '\n\nDocuments on file:';
    for (const doc of docs) {
      caseContext += `\n- ${doc.filename} (${doc.doc_type}): ${doc.ai_summary || doc.ocr_text?.slice(0, 500) || 'No text extracted'}`;
    }
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT_CHAT + caseContext }
  ];

  // Add conversation history (skip the user message we just added - it'll be added at the end)
  for (const msg of history.slice(0, -1)) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.4,
    max_tokens: 4000
  });

  const reply = response.choices[0]?.message?.content || 'I was unable to generate a response. Please try again.';

  repo.createMessage(caseId, 'assistant', reply);
  return reply;
}

export function isConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY);
}
