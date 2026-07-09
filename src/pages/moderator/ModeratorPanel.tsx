import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  UserCheck,
  FileText,
  Trash2,
  AlertTriangle,
  Search,
  BookOpen,
} from 'lucide-react';

interface LibraryNote {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'moderator' | 'admin';
  college: string;
}

const INITIAL_QUEUE: LibraryNote[] = [
  {
    id: 'n-new-1',
    title: 'Finite Automata & Regular Expressions Guide',
    description: 'Detailed drawings of DFA/NFA conversions with clean step-by-step state transition proofs.',
    subject: 'Compiler Design',
    status: 'pending',
    user_name: 'Rahul Varma',
  },
  {
    id: 'n-new-2',
    title: 'Computer Architecture Cache Mapping Notes',
    description: 'Summary formulas for Direct-Mapped, Set-Associative, and Fully-Associative caches.',
    subject: 'Computer Architecture',
    status: 'pending',
    user_name: 'Neha Mehta',
  },
];

const INITIAL_USERS: UserAccount[] = [
  { id: 'u-1', name: 'Varun Sharma', email: 'student@studyys.edu', role: 'student', college: 'IIT Delhi' },
  { id: 'u-2', name: 'Dr. Anita Roy', email: 'moderator@studyys.edu', role: 'moderator', college: 'BITS Pilani' },
  { id: 'u-3', name: 'Admin User', email: 'admin@studyys.edu', role: 'admin', college: 'Studyys Academic' },
];

export const ModeratorPanel: React.FC = () => {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<LibraryNote[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'users' | 'reports'>('queue');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    // Sync lists
    const storedLib = localStorage.getItem('studyys_library');
    if (storedLib) {
      const lib = JSON.parse(storedLib);
      // Filter pending ones + combine with custom initial queue
      const pendingLib = lib.filter((n: any) => n.status === 'pending');
      setQueue([...INITIAL_QUEUE, ...pendingLib]);
    } else {
      setQueue(INITIAL_QUEUE);
    }
    setUsers(INITIAL_USERS);
  }, []);

  const handleApprove = (id: string) => {
    // Update local state
    setQueue(queue.filter((n) => n.id !== id));
    
    // Update in shared library storage if matches
    const storedLib = localStorage.getItem('studyys_library');
    if (storedLib) {
      const lib = JSON.parse(storedLib);
      const updated = lib.map((n: any) => n.id === id ? { ...n, status: 'approved' } : n);
      localStorage.setItem('studyys_library', JSON.stringify(updated));
    }
    alert('Document approved and published to the Shared Library.');
  };

  const handleReject = (id: string) => {
    setQueue(queue.filter((n) => n.id !== id));
    const storedLib = localStorage.getItem('studyys_library');
    if (storedLib) {
      const lib = JSON.parse(storedLib);
      const updated = lib.map((n: any) => n.id === id ? { ...n, status: 'rejected' } : n);
      localStorage.setItem('studyys_library', JSON.stringify(updated));
    }
    alert('Document rejected.');
  };

  const handleRoleChange = (id: string, newRole: 'student' | 'moderator' | 'admin') => {
    const updated = users.map((u) => u.id === id ? { ...u, role: newRole } : u);
    setUsers(updated);
    alert(`User role updated to ${newRole}.`);
  };

  if (profile?.role !== 'moderator' && profile?.role !== 'admin') {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Access Denied</h3>
        <p className="text-xs text-slate-400 mt-1">
          Only registered Academic Moderators or System Administrators can access this console.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-amber-500" />
          <span>Moderator Panel</span>
        </h2>
        <p className="text-slate-500 text-sm">
          Review notes approvals queue, moderate flags, and manage academic accounts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'queue' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Review Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'users' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'reports' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Reported Content (0)
        </button>
      </div>

      {/* Content */}
      {activeTab === 'queue' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {queue.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Queue is completely clear!</p>
              <p className="text-xs text-slate-400 mt-1">No new materials awaiting validation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-blue-50 text-brand-600 font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                        {item.subject}
                      </span>
                      <span className="text-[10px] text-slate-400">Submitted by: <span className="font-semibold text-slate-600">{item.user_name}</span></span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 leading-normal">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleReject(item.id)}
                      className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-slate-800 text-sm">Account Directory</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user accounts..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold pb-2">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">College</th>
                  <th className="pb-3">Active Role</th>
                  <th className="pb-3 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{user.name}</td>
                    <td className="py-3 text-slate-500">{user.email}</td>
                    <td className="py-3 text-slate-500">{user.college}</td>
                    <td className="py-3">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-red-50 text-red-700' : user.role === 'moderator' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-brand-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                        className="px-2 py-1 rounded border border-slate-200 bg-white text-xs focus:outline-none"
                      >
                        <option value="student">Student</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center py-16">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No flags reported</p>
          <p className="text-xs text-slate-400 mt-1">Excellent job keeping materials clean.</p>
        </div>
      )}
    </div>
  );
};
