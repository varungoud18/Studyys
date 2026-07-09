import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import {
  History as HistoryIcon,
  Search,
  Download,
  Calendar,
  Filter,
  GraduationCap,
  MessageSquare,
  BookOpen,
  Layers,
  FileText,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'AI Chat' | 'Quiz Attempt' | 'Flashcard Review' | 'PDF Upload';
  title: string;
  detail: string;
  subject: string;
  date: string;
}

const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: 'h-1',
    type: 'Quiz Attempt',
    title: 'Data Structures and Algorithms quiz',
    detail: 'Scored 90% (9/10 correct)',
    subject: 'Data Structures',
    date: '2026-07-09',
  },
  {
    id: 'h-2',
    type: 'AI Chat',
    title: 'Dijkstra shortest path algorithm execution',
    detail: 'Asked details on priority queue implementation',
    subject: 'Data Structures',
    date: '2026-07-09',
  },
  {
    id: 'h-3',
    type: 'PDF Upload',
    title: 'Operating Systems - Lecture Notes 4.pdf',
    detail: 'Uploaded and structured successfully',
    subject: 'Operating Systems',
    date: '2026-07-08',
  },
  {
    id: 'h-4',
    type: 'Flashcard Review',
    topic: 'Computer Networks',
    title: 'Reviewed sliding window protocol deck',
    detail: '3 flashcards completed, 1 bookmarked',
    subject: 'Computer Networks',
    date: '2026-07-07',
  } as any,
];

export const History: React.FC = () => {
  const { isMock, profile } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');

  useEffect(() => {
    if (!profile) return;

    if (isMock) {
      const histKey = `studyys_${profile.id}_history`;
      const stored = localStorage.getItem(histKey);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        const isPreseeded = ['mock-student-id', 'mock-mod-id', 'mock-admin-id'].includes(profile?.id || '');
        const mockHist = isPreseeded ? DEFAULT_HISTORY : [];
        setHistory(mockHist);
        localStorage.setItem(histKey, JSON.stringify(mockHist));
      }
    } else {
      const fetchSupabaseHistory = async () => {
        try {
          // Fetch questions
          const { data: qData } = await supabase
            .from('questions')
            .select('id, query, confidence, created_at')
            .eq('user_id', profile.id);

          // Fetch quiz attempts
          const { data: qAttempts } = await supabase
            .from('quiz_attempts')
            .select('id, score, total_questions, created_at, quizzes (title, subject_id, subjects (name))')
            .eq('user_id', profile.id);

          // Fetch uploaded docs
          const { data: docs } = await supabase
            .from('documents')
            .select('id, title, file_size, created_at')
            .eq('user_id', profile.id);

          const items: HistoryItem[] = [];

          if (qData) {
            qData.forEach((q: any) => {
              items.push({
                id: q.id,
                type: 'AI Chat',
                title: q.query,
                detail: `Answered with ${Math.round(parseFloat(q.confidence || '0') * 100)}% confidence`,
                subject: 'AI Assistant',
                date: new Date(q.created_at).toLocaleDateString()
              });
            });
          }

          if (qAttempts) {
            qAttempts.forEach((a: any) => {
              items.push({
                id: a.id,
                type: 'Quiz Attempt',
                title: `${a.quizzes?.title || 'General'} Quiz`,
                detail: `Scored ${a.score}% (${Math.round(a.score / 100 * a.total_questions)}/${a.total_questions} correct)`,
                subject: a.quizzes?.subjects?.name || 'Engineering',
                date: new Date(a.created_at).toLocaleDateString()
              });
            });
          }

          if (docs) {
            docs.forEach((d: any) => {
              items.push({
                id: d.id,
                type: 'PDF Upload',
                title: d.title,
                detail: `Uploaded successfully (${(d.file_size / (1024 * 1024)).toFixed(1)} MB)`,
                subject: 'Document',
                date: new Date(d.created_at).toLocaleDateString()
              });
            });
          }

          // Sort descending by date
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setHistory(items);
        } catch (err) {
          console.error('Error fetching history:', err);
        }
      };
      fetchSupabaseHistory();
    }
  }, [isMock, profile]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'AI Chat':
        return MessageSquare;
      case 'Quiz Attempt':
        return BookOpen;
      case 'Flashcard Review':
        return Layers;
      default:
        return FileText;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'AI Chat':
        return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Quiz Attempt':
        return 'text-purple-500 bg-purple-50 border-purple-100';
      case 'Flashcard Review':
        return 'text-amber-500 bg-amber-50 border-amber-100';
      default:
        return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  const handleExport = () => {
    // Generate text log download
    const titleString = 'Studyys Study History Log\nGenerated on: ' + new Date().toLocaleDateString() + '\n\n';
    const logBody = history
      .map((h) => `[${h.date}] [${h.type}] [${h.subject}] ${h.title} - ${h.detail}`)
      .join('\n');
    
    const blob = new Blob([titleString + logBody], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `studyys_study_history_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subjectsList = ['All', ...Array.from(new Set(history.map((h) => h.subject)))];

  const filteredHistory = history.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(search.toLowerCase()) || 
                          h.detail.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || h.type === typeFilter;
    const matchesSubject = subjectFilter === 'All' || h.subject === subjectFilter;
    return matchesSearch && matchesType && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-7 h-7 text-brand-500" />
            <span>Study History</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Review your academic logs, quiz attempts, and AI conversations.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filters panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Type select */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Formats</option>
            <option value="AI Chat">AI Chats</option>
            <option value="Quiz Attempt">Quizzes</option>
            <option value="PDF Upload">Uploads</option>
          </select>
        </div>

        {/* Subject select */}
        <div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center">
            <HistoryIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No activities found</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your filter parameters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <div key={item.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition">
                  <div className={`p-2 rounded-xl border ${getIconColor(item.type)} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {item.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {item.date}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1 leading-normal">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
