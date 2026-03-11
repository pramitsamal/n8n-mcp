import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth, PinScreen } from './auth';
import { CaseList } from './pages/CaseList';
import { NewCase } from './pages/NewCase';
import { CaseDetail } from './pages/CaseDetail';
import { Chat } from './pages/Chat';
import { DocumentView } from './pages/DocumentView';

function Layout({ children, title, showBack }: { children: React.ReactNode; title: string; showBack?: boolean }) {
  const navigate = useNavigate();
  return (
    <>
      <header className="header">
        {showBack && (
          <button className="header-btn" onClick={() => navigate(-1)}>&larr;</button>
        )}
        <h1>{title}</h1>
      </header>
      <main>{children}</main>
      <nav className="nav">
        <NavLink to="/" end>
          <span className="nav-icon">{'\u{1F4BC}'}</span>
          Cases
        </NavLink>
        <NavLink to="/search">
          <span className="nav-icon">{'\u{1F50D}'}</span>
          Search
        </NavLink>
      </nav>
    </>
  );
}

function CaseListPage() {
  return <Layout title="Clawtainer"><CaseList /></Layout>;
}

function NewCasePage() {
  return <Layout title="New Case" showBack><NewCase /></Layout>;
}

function CaseDetailPage() {
  const { id } = useParams();
  return <Layout title="Case Details" showBack><CaseDetail id={id!} /></Layout>;
}

function ChatPage() {
  const { id } = useParams();
  return <Layout title="AI Assistant" showBack><Chat caseId={id!} /></Layout>;
}

function DocumentViewPage() {
  const { id } = useParams();
  return <Layout title="Document" showBack><DocumentView docId={id!} /></Layout>;
}

function SearchPage() {
  return <Layout title="Search Cases"><CaseList showSearch /></Layout>;
}

export function App() {
  const { loading, authenticated, login } = useAuth();

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  if (!authenticated) {
    return <PinScreen onAuth={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CaseListPage />} />
        <Route path="/new-case" element={<NewCasePage />} />
        <Route path="/case/:id" element={<CaseDetailPage />} />
        <Route path="/case/:id/chat" element={<ChatPage />} />
        <Route path="/document/:id" element={<DocumentViewPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  );
}
