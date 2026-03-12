const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('clawtainer_token');
}

export function setToken(token: string): void {
  localStorage.setItem('clawtainer_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('clawtainer_token');
}

export function hasToken(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  const text = await res.text();
  if (!text) throw new Error('Server returned an empty response');
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('Server returned an invalid response'); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

// Auth
export const authStatus = () => request<{ setupRequired: boolean; userName: string | null }>('/auth/status');
export const authSetup = (name: string, pin: string) =>
  request<{ token: string; user: { id: string; name: string } }>('/auth/setup', {
    method: 'POST', body: JSON.stringify({ name, pin })
  });
export const authLogin = (pin: string) =>
  request<{ token: string; user: { id: string; name: string } }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ pin })
  });

// Cases
export interface CaseData {
  id: string;
  title: string;
  case_number: string | null;
  court: string | null;
  case_type: string | null;
  status: string;
  petitioner: string | null;
  respondent: string | null;
  lawyer_role: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stats?: { documents: number; events: number; messages: number };
}

export const getCases = (search?: string) =>
  request<CaseData[]>(`/cases${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const getCase = (id: string) => request<CaseData>(`/cases/${id}`);
export const createCase = (data: Partial<CaseData>) =>
  request<CaseData>('/cases', { method: 'POST', body: JSON.stringify(data) });
export const updateCase = (id: string, data: Partial<CaseData>) =>
  request<CaseData>(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCase = (id: string) =>
  request<{ success: boolean }>(`/cases/${id}`, { method: 'DELETE' });

// Documents
export interface DocData {
  id: string;
  case_id: string;
  filename: string;
  doc_type: string | null;
  ocr_text: string | null;
  ai_summary: string | null;
  ai_analysis: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export const getDocuments = (caseId: string) => request<DocData[]>(`/cases/${caseId}/documents`);
export const getDocument = (id: string) => request<DocData>(`/documents/${id}`);
export const uploadDocument = async (caseId: string, file: File, docType: string, ocrText?: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('doc_type', docType);
  if (ocrText) form.append('ocr_text', ocrText);
  return request<DocData>(`/cases/${caseId}/documents`, { method: 'POST', body: form });
};
export const analyzeDocument = (id: string) =>
  request<{ analysis: Record<string, unknown> }>(`/documents/${id}/analyze`, { method: 'POST' });
export const extractDocumentText = (id: string) =>
  request<{ success: boolean; ocr_text: string }>(`/documents/${id}/extract`, { method: 'POST' });
export const updateDocument = (id: string, data: Partial<DocData>) =>
  request<DocData>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Timeline
export interface TimelineEventData {
  id: string;
  case_id: string;
  event_date: string;
  event_type: string | null;
  title: string;
  description: string | null;
  document_id: string | null;
  created_at: string;
}

export const getTimeline = (caseId: string) => request<TimelineEventData[]>(`/cases/${caseId}/timeline`);
export const createTimelineEvent = (caseId: string, data: Partial<TimelineEventData>) =>
  request<TimelineEventData>(`/cases/${caseId}/timeline`, { method: 'POST', body: JSON.stringify(data) });

// Chat
export interface MessageData {
  id: string;
  case_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const getChat = (caseId: string) => request<MessageData[]>(`/cases/${caseId}/chat`);
export const sendChat = (caseId: string, message: string) =>
  request<{ reply: string }>(`/cases/${caseId}/chat`, { method: 'POST', body: JSON.stringify({ message }) });
