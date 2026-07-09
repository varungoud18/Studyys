import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Award,
  BookOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const dailyUsageData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.8 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4.2 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 5.0 },
  { day: 'Sun', hours: 2.0 },
];

const subjectData = [
  { name: 'Operating Systems', value: 35, color: '#0e8ce2' },
  { name: 'Data Structures', value: 40, color: '#8b5cf6' },
  { name: 'Computer Networks', value: 15, color: '#10b981' },
  { name: 'Compiler Design', value: 10, color: '#f59e0b' },
];

const quizTrendData = [
  { attempt: 'Test 1', score: 70 },
  { attempt: 'Test 2', score: 85 },
  { attempt: 'Test 3', score: 80 },
  { attempt: 'Test 4', score: 95 },
  { attempt: 'Test 5', score: 90 },
];

export const Reports: React.FC = () => {
  const exportCSV = () => {
    const csvContent = 
      'Subject,Activity Count,Study Minutes,Average Quiz Score\n' +
      'Operating Systems,15,450,82\n' +
      'Data Structures,22,620,88\n' +
      'Computer Networks,8,210,78\n' +
      'Compiler Design,6,150,85\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `studyys_academic_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-500" />
            <span>Academic Analytics & Reports</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Evaluate your course preparation levels, core strengths, and learning patterns.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-brand-500 rounded-xl border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">21.5 hrs</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Total Study Time</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-500 rounded-xl border border-purple-100">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">84.5%</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Average Exam Score</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl border border-emerald-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">4 subjects</h4>
            <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Active Courses</p>
          </div>
        </div>
      </div>

      {/* Main Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily study hours (Bar) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Study Time per Day</h3>
            <p className="text-[10px] text-slate-400 font-medium">Daily study distribution for current week</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyUsageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="hours" name="Study Hours" fill="#0e8ce2" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz attempts trend (Line) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Quiz Performance Trend</h3>
            <p className="text-[10px] text-slate-400 font-medium">Progress curves across consecutive test takes</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="attempt" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="score" name="Score %" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject distribution (Pie) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Study Time by Subject</h3>
            <p className="text-[10px] text-slate-400 font-medium">Proportional allocation of minutes spent</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {subjectData.map((subj) => (
                <div key={subj.name} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: subj.color }}></span>
                    <span className="text-xs font-semibold text-slate-700">{subj.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{subj.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
