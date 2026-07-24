import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { askGemini } from '../../services/gemini';
import { supabase } from '../../services/supabase';
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
  subject_id?: string;
}

export const AskAI: React.FC = () => {
  const { isMock, profile } = useAuth();
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('general-knowledge');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load documents for select box
  useEffect(() => {
    if (isMock) {
      const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
      const stored = localStorage.getItem(filesKey);
      let parsed = stored ? JSON.parse(stored) : [];
      if (parsed.length === 0) {
        parsed = [
          { id: 'doc-1', title: 'Operating Systems - Lecture Notes 4.pdf', subject: 'Operating Systems' },
          { id: 'doc-2', title: 'Data Structures and Algorithms - Midterm Syllabus.pdf', subject: 'Data Structures' },
        ];
      }
      const list = [
        { id: 'general-knowledge', title: 'General Knowledge (No PDF)', subject: 'General' },
        ...parsed
      ];
      setDocuments(list);
      setSelectedDocId('general-knowledge');
    } else {
      const fetchSupabaseDocs = async () => {
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('id, title, subject_id, subjects (name)')
            .eq('status', 'completed');
          if (error) throw error;
          const docsList = (data || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            subject: d.subjects?.name || 'Engineering',
            subject_id: d.subject_id,
          }));
          const list = [
            { id: 'general-knowledge', title: 'General Knowledge (No PDF)', subject: 'General' },
            ...docsList
          ];
          setDocuments(list);
          setSelectedDocId('general-knowledge');
        } catch (err) {
          console.error('Error fetching supabase documents:', err);
          setDocuments([{ id: 'general-knowledge', title: 'General Knowledge (No PDF)', subject: 'General' }]);
          setSelectedDocId('general-knowledge');
        }
      };
      fetchSupabaseDocs();
    }

    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I am your engineering co-pilot. Select one of your uploaded PDF materials, or choose 'General Knowledge (No PDF)' to ask me anything directly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [isMock, profile]);

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
      let contextText = '';
      const selectedDoc = documents.find((d) => d.id === selectedDocId);
      if (selectedDoc && selectedDocId !== 'general-knowledge') {
        if (isMock) {
          const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
          const stored = localStorage.getItem(filesKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const doc = parsed.find((d: any) => d.id === selectedDocId);
            if (doc && doc.extracted_text) {
              contextText = doc.extracted_text
                .map((p: any) => `Page ${p.pageNumber}: ${p.text}`)
                .join('\n\n');
            }
          }
        } else {
          // Fetch from database chunks
          const { data: chunks, error } = await supabase
            .from('document_chunks')
            .select('chunk_text, page_number')
            .eq('document_id', selectedDocId)
            .order('page_number', { ascending: true });
          
          if (chunks && chunks.length > 0) {
            contextText = chunks
              .map((c: any) => `Page ${c.page_number}: ${c.chunk_text}`)
              .join('\n\n');
          }
        }
      }

      if (!contextText && selectedDoc && selectedDocId !== 'general-knowledge') {
        contextText = `Reference document: ${selectedDoc.title}. Subject: ${selectedDoc.subject}.`;
      }

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
      
      // Save history & stats
      if (isMock) {
        if (profile) {
          // 1. History
          const histKey = `studyys_${profile.id}_history`;
          const storedHistory = localStorage.getItem(histKey) || '[]';
          const historyList = JSON.parse(storedHistory);
          historyList.unshift({
            id: `hist-${Date.now()}`,
            type: 'AI Chat',
            title: currentQuery,
            detail: `Answered with ${Math.round(aiResponse.confidence * 100)}% confidence`,
            subject: selectedDoc?.subject || 'Engineering',
            date: new Date().toLocaleDateString(),
          });
          localStorage.setItem(histKey, JSON.stringify(historyList));

          // 2. Questions Asked Counter
          const questionsKey = `studyys_${profile.id}_questions`;
          const currentCount = parseInt(localStorage.getItem(questionsKey) || '0', 10);
          localStorage.setItem(questionsKey, (currentCount + 1).toString());

          // 3. Study Session (2 minutes per chat query)
          const sessionsKey = `studyys_${profile.id}_study_sessions`;
          const sessionsStored = localStorage.getItem(sessionsKey) || '[]';
          const sessionsList = JSON.parse(sessionsStored);
          sessionsList.unshift({
            id: `session-${Date.now()}`,
            duration_minutes: 2,
            activity_type: 'chat',
            created_at: new Date().toISOString(),
          });
          localStorage.setItem(sessionsKey, JSON.stringify(sessionsList));
        }
      } else {
        if (profile) {
          const saveSupabaseQuestion = async () => {
            try {
              await supabase.from('questions').insert({
                user_id: profile.id,
                document_id: selectedDocId === 'general-knowledge' ? null : (selectedDocId || null),
                query: currentQuery,
                answer: aiResponse.answer,
                referenced_pages: aiResponse.referencedPages || null,
                confidence: aiResponse.confidence,
                difficulty: difficulty
              });

              // Add to study sessions
              await supabase.from('study_sessions').insert({
                user_id: profile.id,
                subject_id: selectedDocId === 'general-knowledge' ? null : (selectedDoc?.subject_id || null),
                duration_minutes: 2,
                activity_type: 'chat',
              });
            } catch (dbErr) {
              console.error('Error saving query to Supabase:', dbErr);
            }
          };
          saveSupabaseQuestion();
        }
      }

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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-500" /> Study Scope
            </h3>

            {/* Select Document */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Reference Document
              </label>
              {documents.length === 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">No PDFs uploaded.</p>
                </div>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-705 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
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
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Response Depth (Difficulty)
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`text-[10px] py-1.5 rounded-lg capitalize font-bold transition-all ${
                      difficulty === lvl
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick query tags */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3">Quick Topics</h3>
            <div className="flex flex-wrap gap-1.5">
              {['Dijkstra Proof', 'TCP vs UDP', 'Virtual Memory', 'Semaphores', 'SQL Joins'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setQuery(`Explain ${topic}`)}
                  className="text-[10px] bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-500/15 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-500/30 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-semibold transition"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Console Viewport */}
        <div className="lg:col-span-3 flex flex-col h-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Top Panel */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-brand-500 text-white rounded-lg">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Gemini Tutor Workspace</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Online
                </span>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
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
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {/* Metadata references */}
                    {msg.sender === 'ai' && (msg.referencedPages || msg.confidence) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2 text-[10px]">
                        {msg.referencedPages && msg.referencedPages.length > 0 && (
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200 dark:border-slate-600">
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
                  <span className={`text-[9px] text-slate-400 dark:text-slate-500 block ${msg.sender === 'user' ? 'text-right' : ''}`}>
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
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm shadow-sm flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  <span>Gemini is compiling reference nodes...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
            <input
              type="text"
              placeholder="Ask a question about your PDF..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm disabled:bg-slate-50 dark:disabled:bg-slate-850"
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
