import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  MessageSquare,
  Layers,
  Award,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';

const chartData = [
  { day: 'Mon', hours: 2.5, score: 75 },
  { day: 'Tue', hours: 3.8, score: 80 },
  { day: 'Wed', hours: 1.5, score: 70 },
  { day: 'Thu', hours: 4.2, score: 90 },
  { day: 'Fri', hours: 3.0, score: 85 },
  { day: 'Sat', hours: 5.0, score: 95 },
  { day: 'Sun', hours: 2.0, score: 88 },
];

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { name: 'Uploaded PDFs', value: '12', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { name: 'Questions Asked', value: '47', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { name: 'Flashcards Reviewed', value: '128', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { name: 'Quiz Attempts', value: '9', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { name: 'Average Quiz Score', value: '84%', icon: TrendingUp, color: 'text-brand-600 bg-brand-50 border-brand-100' },
    { name: 'Study Hours', value: '21.5h', icon: Clock, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  ];

  const recentDocs = [
    { id: '1', title: 'Operating Systems - Lecture Notes 4.pdf', size: '2.4 MB', date: '2 hours ago', subject: 'Operating Systems' },
    { id: '2', title: 'Data Structures and Algorithms - Midterm Syllabus.pdf', size: '4.1 MB', date: 'Yesterday', subject: 'Data Structures' },
    { id: '3', title: 'Computer Networks - Lab Manual.pdf', size: '1.8 MB', date: '3 days ago', subject: 'Computer Networks' },
  ];

  const recentChats = [
    { id: '1', question: 'Explain the working of Dijkstra algorithm in detail', doc: 'Data Structures Midterm' },
    { id: '2', question: 'What is the difference between TCP and UDP headers?', doc: 'Computer Networks Lab' },
    { id: '3', question: 'How does virtual memory paging work?', doc: 'Operating Systems Notes' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-72 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="h-10 w-10 bg-slate-100 rounded-lg animate-pulse"></div>
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 h-80 animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
            <div className="h-full w-full bg-slate-100 rounded"></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-80 animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
            <div className="h-full w-full bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-brand rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-brand-600">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-200 animate-pulse" />
              <span className="text-brand-100 text-xs font-semibold uppercase tracking-wider">Engineering Study Portal</span>
            </div>
            <h2 className="text-3xl font-black font-display leading-tight">
              Welcome Back, {profile?.full_name || 'Student'}!
            </h2>
            <p className="text-white/80 max-w-xl text-sm leading-relaxed">
              Your AI-powered study companion is ready. Upload materials to clear doubts, build flashcard decks, or practice with customized exams.
            </p>
          </div>
          <Link
            to="/ask-ai"
            className="self-start md:self-auto bg-white text-brand-700 font-bold px-6 py-3 rounded-xl shadow hover:bg-brand-50 transition active:scale-[0.98] flex items-center gap-2 text-sm"
          >
            <span>Ask Assistant</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition duration-200 group"
            >
              <div className={`p-2.5 rounded-xl inline-block border ${stat.color} group-hover:scale-110 transition duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-4 tracking-tight">{stat.value}</p>
              <p className="text-slate-400 text-xs font-semibold mt-1">{stat.name}</p>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Weekly Study Trends</h3>
              <p className="text-xs text-slate-400">Hours spent utilizing AI and reviewing materials</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2% this week
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8ce2" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0e8ce2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="hours" name="Study Hours" stroke="#0e8ce2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Performance Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800">Quiz Scores</h3>
            <p className="text-xs text-slate-400">Historical performance by day</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="score" name="Score %" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Lists Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Recent Documents</h3>
              <Link to="/upload" className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-50 rounded-lg text-brand-500 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-600 transition">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {doc.subject} &bull; {doc.size}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{doc.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent AI Chats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Recent AI Queries</h3>
              <Link to="/ask-ai" className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1">
                New Chat <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded border border-purple-100 uppercase">
                      Query
                    </span>
                    <span className="text-[9px] text-slate-400 truncate">{chat.doc}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 truncate group-hover:text-brand-600 transition">
                    "{chat.question}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
