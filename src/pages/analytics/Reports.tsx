import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
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
} from 'recharts';

const colors = ['#0e8ce2', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

const emptyDailyData = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 0 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
];

export const Reports: React.FC = () => {
  const { profile, isMock } = useAuth();
  const [loading, setLoading] = useState(true);

  const [totalStudyHours, setTotalStudyHours] = useState(0);
  const [avgQuizScore, setAvgQuizScore] = useState(0);
  const [activeCoursesCount, setActiveCoursesCount] = useState(0);

  const [dailyUsageData, setDailyUsageData] = useState<any[]>(emptyDailyData);
  const [quizTrendData, setQuizTrendData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    const loadAnalytics = async () => {
      try {
        if (isMock) {
          // 1. Files
          const filesKey = `studyys_${profile.id}_files`;
          const filesList = JSON.parse(localStorage.getItem(filesKey) || '[]');
          
          // 2. Study Sessions
          const sessionsKey = `studyys_${profile.id}_study_sessions`;
          const sessionsList = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
          const totalMin = sessionsList.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);
          setTotalStudyHours(parseFloat((totalMin / 60).toFixed(1)));

          // 3. Quiz Attempts
          const attemptsKey = `studyys_${profile.id}_quiz_attempts`;
          const attemptsList = JSON.parse(localStorage.getItem(attemptsKey) || '[]');
          if (attemptsList.length > 0) {
            const totalScore = attemptsList.reduce((acc: number, a: any) => acc + a.score, 0);
            setAvgQuizScore(Math.round(totalScore / attemptsList.length));
          } else {
            setAvgQuizScore(0);
          }

          // Active Courses
          const uniqueSubjects = new Set<string>();
          filesList.forEach((f: any) => {
            if (f.subject) uniqueSubjects.add(f.subject);
          });
          setActiveCoursesCount(uniqueSubjects.size);

          // Daily Usage
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const dayMap = days.reduce((acc: any, d) => {
            acc[d] = 0;
            return acc;
          }, {});
          sessionsList.forEach((s: any) => {
            const date = new Date(s.created_at || s.date);
            let dayIdx = date.getDay() - 1;
            if (dayIdx < 0) dayIdx = 6;
            const dayName = days[dayIdx];
            if (dayName) {
              dayMap[dayName] += (s.duration_minutes || 0) / 60;
            }
          });
          const computedDaily = days.map(d => ({
            day: d,
            hours: parseFloat(dayMap[d].toFixed(1))
          }));
          setDailyUsageData(computedDaily);

          // Quiz Trend (last 5)
          const computedTrend = attemptsList.slice(0, 5).reverse().map((a: any, idx: number) => ({
            attempt: `Test ${idx + 1}`,
            score: a.score
          }));
          setQuizTrendData(computedTrend);

          // Subject Data
          const subjectMap: Record<string, number> = {};
          filesList.forEach((f: any) => {
            if (f.subject) {
              subjectMap[f.subject] = (subjectMap[f.subject] || 0) + 1;
            }
          });
          const totalFiles = filesList.length;
          const computedSubjects = Object.keys(subjectMap).map((name, idx) => ({
            name: name,
            value: totalFiles > 0 ? Math.round((subjectMap[name] / totalFiles) * 100) : 0,
            color: colors[idx % colors.length]
          }));
          setSubjectData(computedSubjects);

        } else {
          // --- Real Supabase Mode ---
          const [sessionsRes, attemptsRes, docsRes] = await Promise.all([
            supabase.from('study_sessions').select('duration_minutes, created_at, subject_id, subjects (name)').eq('user_id', profile.id),
            supabase.from('quiz_attempts').select('score, created_at').eq('user_id', profile.id).order('created_at', { ascending: true }),
            supabase.from('documents').select('subject_id, subjects (name)').eq('user_id', profile.id)
          ]);

          // Study Sessions
          const sessions = sessionsRes.data || [];
          const totalMin = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
          setTotalStudyHours(parseFloat((totalMin / 60).toFixed(1)));

          // Quiz Attempts
          const attempts = attemptsRes.data || [];
          if (attempts.length > 0) {
            const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
            setAvgQuizScore(Math.round(totalScore / attempts.length));
          } else {
            setAvgQuizScore(0);
          }

          // Documents / Courses count
          const docs = docsRes.data || [];
          const uniqueSubjects = new Set<string>();
          docs.forEach((d: any) => {
            const name = d.subjects?.name;
            if (name) uniqueSubjects.add(name);
          });
          setActiveCoursesCount(uniqueSubjects.size);

          // Daily Usage
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const dayMap = days.reduce((acc: any, d) => {
            acc[d] = 0;
            return acc;
          }, {});
          sessions.forEach((s: any) => {
            const date = new Date(s.created_at);
            let dayIdx = date.getDay() - 1;
            if (dayIdx < 0) dayIdx = 6;
            const dayName = days[dayIdx];
            if (dayName) {
              dayMap[dayName] += (s.duration_minutes || 0) / 60;
            }
          });
          const computedDaily = days.map(d => ({
            day: d,
            hours: parseFloat(dayMap[d].toFixed(1))
          }));
          setDailyUsageData(computedDaily);

          // Quiz Trend
          const computedTrend = attempts.slice(-5).map((a, idx) => ({
            attempt: `Test ${idx + 1}`,
            score: a.score
          }));
          setQuizTrendData(computedTrend);

          // Subject Distribution from sessions
          const subjectMinMap: Record<string, number> = {};
          sessions.forEach((s: any) => {
            const subjName = s.subjects?.name || 'General Study';
            subjectMinMap[subjName] = (subjectMinMap[subjName] || 0) + s.duration_minutes;
          });
          const totalSessionMins = Object.values(subjectMinMap).reduce((a, b) => a + b, 0);
          const computedSubjects = Object.keys(subjectMinMap).map((name, idx) => ({
            name: name,
            value: totalSessionMins > 0 ? Math.round((subjectMinMap[name] / totalSessionMins) * 100) : 0,
            color: colors[idx % colors.length]
          }));
          setSubjectData(computedSubjects);
        }
      } catch (err) {
        console.error('Error fetching academic reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [profile, isMock]);

  const exportCSV = () => {
    let csvContent = 'Subject,Activity Count,Study Minutes,Average Quiz Score\n';
    if (subjectData.length > 0) {
      subjectData.forEach(s => {
        csvContent += `${s.name},-,${Math.round(s.value * totalStudyHours * 0.6)},${avgQuizScore}\n`;
      });
    } else {
      csvContent += 'General Study,-,0,0\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `studyys_academic_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-500" />
            <span>Academic Analytics & Reports</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Evaluate your course preparation levels, core strengths, and learning patterns.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-brand-500 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{totalStudyHours} hrs</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Total Study Time</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl border border-purple-100 dark:border-purple-900/50">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{avgQuizScore}%</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Average Exam Score</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{activeCoursesCount} courses</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Active Courses</p>
          </div>
        </div>
      </div>

      {/* Main Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily study hours (Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Study Time per Day</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Daily study distribution for current week</p>
          </div>
          <div className="h-64">
            {totalStudyHours === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                No daily usage recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyUsageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', background: '#fff' }} />
                  <Bar dataKey="hours" name="Study Hours" fill="#0e8ce2" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quiz attempts trend (Line) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Quiz Performance Trend</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Progress curves across consecutive test takes</p>
          </div>
          <div className="h-64">
            {quizTrendData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                <Award className="w-8 h-8 mb-2 opacity-50" />
                No quiz attempts recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                  <XAxis dataKey="attempt" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', background: '#fff' }} />
                  <Line type="monotone" dataKey="score" name="Score %" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject distribution (Pie) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Study Time by Subject</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Proportional allocation of minutes spent</p>
          </div>
          {subjectData.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              <BookOpen className="w-8 h-8 mb-2 opacity-50" />
              No subject-specific activity recorded yet.
            </div>
          ) : (
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
                  <div key={subj.name} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: subj.color }}></span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-305">{subj.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{subj.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
