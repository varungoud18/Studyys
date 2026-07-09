import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  GraduationCap,
  Building,
  BookOpen,
  Hash,
  Sparkles,
  Award,
  Save,
  CheckCircle,
  FileText,
  Clock,
  Mail,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  
  // Form states
  const [name, setName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [semester, setSemester] = useState(profile?.semester || 1);
  
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateProfile({
        full_name: name,
        bio,
        college,
        branch,
        semester: Number(semester),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const badges = [
    { name: 'Alpha Reader', desc: 'Uploaded 5+ PDFs', earned: true, icon: FileText, color: 'text-blue-500 bg-blue-50 border-blue-100' },
    { name: 'Gemini Scholar', desc: 'Asked AI 20+ questions', earned: true, icon: Sparkles, color: 'text-purple-500 bg-purple-50 border-purple-100' },
    { name: 'Test Master', desc: 'Scored 90%+ on any quiz', earned: true, icon: Award, color: 'text-amber-500 bg-amber-50 border-amber-100' },
    { name: 'Tutor Assistant', desc: 'Shared notes in library', earned: false, icon: GraduationCap, color: 'text-slate-400 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <User className="w-7 h-7 text-brand-500" />
          <span>My Profile & Settings</span>
        </h2>
        <p className="text-slate-500 text-sm">
          Customize your academic settings, view milestone achievements, and review study metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Profile Summary & Badges */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm space-y-4">
            <div className="relative inline-block">
              <img
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt="avatar"
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-brand-500"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full"></span>
            </div>
            
            <div>
              <h3 className="text-lg font-black text-slate-800">{profile?.full_name}</h3>
              <p className="text-xs text-slate-400 mt-1 capitalize font-semibold">{profile?.role} Account</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed italic">
              "{profile?.bio || 'No status bio set. Edit profile details on the right.'}"
            </p>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <div>
                <p className="text-sm font-black text-slate-800">12</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Uploads</p>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">9</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Quizzes</p>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">3</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Badges</p>
              </div>
            </div>
          </div>

          {/* Gamified Achievements Badges */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-brand-500" /> Milestone Achievements
            </h3>
            
            <div className="space-y-3">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.name}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                      badge.earned ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border ${badge.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{badge.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column Profile Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
              <h3 className="font-bold text-slate-800 text-sm">Account Settings</h3>
              {success && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Details saved successfully!
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={profile?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Academic Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your courses, research interests, or academic focus..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">College/University</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Branch/Major</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Current Semester</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-1.5 shadow active:scale-95 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
