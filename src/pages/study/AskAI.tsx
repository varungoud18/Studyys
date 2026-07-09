import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { askGemini } from '../../services/gemini';
import {
  Brain,
  MessageSquare,
  Sparkles,
  BookOpen,
  Send,
  Loader2,
  FileText,
  AlertCircle,
  TrendingUp,
  Bookmark,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  referencedPages?: number[];
  confidence?: number;
}

interface DocumentOption {
  id: string;
  title: string;
  subject: string;
}

export const AskAI: React.FC = () => {
  const { isMock } = useAuth();
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load documents for select box
  useEffect(() => {
    const stored = localStorage.getItem('studyys_files');
    if (stored) {
      const parsed = JSON.parse(stored);
      setDocuments(parsed);
      if (parsed.length > 0) {
        setSelectedDocId(parsed[0].id);
      }
    } else {
      const defaultDocs = [
        { id: 'doc-1', title: 'Operating Systems - Lecture Notes 4.pdf', subject: 'Operating Systems' },
        { id: 'doc-2', title: 'Data Structures and Algorithms - Midterm Syllabus.pdf', subject: 'Data Structures' },
      ];
      setDocuments(defaultDocs);
      setSelectedDocId('doc-1');
    }

    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I am your engineering co-pilot. Select one of your uploaded PDF materials, choose your difficulty, and ask me anything about the textbook content.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const selectedDoc = documents.find((d) => d.id === selectedDocId);
      const contextText = selectedDoc
        ? `This is mock PDF chunk text extracted from "${selectedDoc.title}" in the subject "${selectedDoc.subject}".`
        : '';

      const aiResponse = await askGemini(currentQuery, contextText, difficulty);

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponse.answer,
        referencedPages: aiResponse.referencedPages,
        confidence: aiResponse.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      // Save query history locally
      const storedHistory = localStorage.getItem('studyys_history') || '[]';
      const historyList = JSON.parse(storedHistory);
      historyList.unshift({
        id: `hist-${Date.now()}`,
        type: 'AI Chat',
        title: currentQuery,
        detail: `Answered with ${Math.round(aiResponse.confidence * 100)}% confidence`,
        subject: selectedDoc?.subject || 'Engineering',
        date: new Date().toLocaleDateString(),
      });
      localStorage.setItem('studyys_history', JSON.stringify(historyList));

    } catch (err: any) {
      console.error(err);
      setErrorMsg('An error occurred while connecting with Gemini. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadgeColor = (conf: number) => {
    if (conf >= 0.9) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (conf >= 0.75) return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Brain className="w-7 h-7 text-brand-500" />
            <span>AI Study Assistant</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Ask complex formulas, request code snippets, or query details from your PDFs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workspace Sidebar Setup */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-500" /> Study Scope
            </h3>

            {/* Select Document */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Reference Document
              </label>
              {documents.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                  <p className="text-[10px] text-slate-500">No PDFs uploaded.</p>
                </div>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs bg-white"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.subject})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select Difficulty */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Response Depth (Difficulty)
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`text-[10px] py-1.5 rounded-lg capitalize font-bold transition-all ${
                      difficulty === lvl
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick query tags */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Quick Topics</h3>
            <div className="flex flex-wrap gap-1.5">
              {['Dijkstra Proof', 'TCP vs UDP', 'Virtual Memory', 'Semaphores', 'SQL Joins'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setQuery(`Explain ${topic}`)}
                  className="text-[10px] bg-slate-50 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 hover:border-brand-200 px-2.5 py-1 rounded-lg text-slate-600 font-semibold transition"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Console Viewport */}
        <div className="lg:col-span-3 flex flex-col h-[550px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Top Panel */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-brand-500 text-white rounded-lg">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Gemini Tutor Workspace</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Online
                </span>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4 bg-slate-50/30">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 max-w-xl mx-auto">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <span className="text-xs text-red-700">{errorMsg}</span>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-brand-500 text-white border-brand-600'
                  }`}
                >
                  {msg.sender === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Msg text */}
                <div className="space-y-1.5">
                  <div
                    className={`rounded-2xl p-4 text-sm shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-brand text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {/* Metadata references */}
                    {msg.sender === 'ai' && (msg.referencedPages || msg.confidence) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[10px]">
                        {msg.referencedPages && msg.referencedPages.length > 0 && (
                          <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                            <FileText className="w-3 h-3 text-slate-400" /> Pages:{' '}
                            {msg.referencedPages.join(', ')}
                          </span>
                        )}
                        {msg.confidence !== undefined && (
                          <span className={`font-bold px-2 py-0.5 rounded flex items-center gap-1 ${getConfidenceBadgeColor(msg.confidence)}`}>
                            <TrendingUp className="w-3 h-3" /> Confidence:{' '}
                            {Math.round(msg.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-400 block ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center border border-brand-600 flex-shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm shadow-sm flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  <span>Gemini is compiling reference nodes...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-3">
            <input
              type="text"
              placeholder="Ask a question about your PDF..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-gradient-brand text-white p-2.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
