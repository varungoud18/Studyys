import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FolderHeart,
  Search,
  ThumbsUp,
  Download,
  Share2,
  Filter,
  Plus,
  BookOpen,
  Check,
  X,
  Badge,
} from 'lucide-react';

interface SharedNote {
  id: string;
  title: string;
  description: string;
  semester: number;
  branch: string;
  subject: string;
  tags: string[];
  upvotes: number;
  downloads: number;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  created_at: string;
}

const INITIAL_NOTES: SharedNote[] = [
  {
    id: 'n-1',
    title: 'Operating Systems Semaphores & Mutex Cheat Sheet',
    description: 'Detailed analysis of classical synchronization problems (Producer-Consumer, Reader-Writer) with complete pseudo-code.',
    semester: 4,
    branch: 'Computer Science',
    subject: 'Operating Systems',
    tags: ['Synchronization', 'Mutex', 'Concurrency'],
    upvotes: 42,
    downloads: 156,
    status: 'approved',
    user_name: 'Varun Sharma',
    created_at: '2026-07-08',
  },
  {
    id: 'n-2',
    title: 'Computer Networks Transport Layer Review Notes',
    description: 'Summarized comparison tables of TCP vs UDP headers, sliding window buffer computations, and Congestion Control mechanisms.',
    semester: 5,
    branch: 'Computer Science',
    subject: 'Computer Networks',
    tags: ['TCP', 'UDP', 'Congestion Control'],
    upvotes: 28,
    downloads: 94,
    status: 'approved',
    user_name: 'Aditya Sen',
    created_at: '2026-07-06',
  },
  {
    id: 'n-3',
    title: 'Graph Algorithms Proofs & Complexity Table',
    description: 'Vetted list of complexity figures for BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, and Prim, with execution proofs.',
    semester: 3,
    branch: 'Computer Science',
    subject: 'Algorithms',
    tags: ['Graph', 'Dijkstra', 'Complexity'],
    upvotes: 61,
    downloads: 210,
    status: 'approved',
    user_name: 'Anita Roy',
    created_at: '2026-07-05',
  },
];

export const SharedLibrary: React.FC = () => {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  
  // Publish modal state
  const [publishModal, setPublishModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBranch, setNewBranch] = useState('Computer Science');
  const [newSem, setNewSem] = useState(1);
  const [newSub, setNewSub] = useState('');
  const [newTags, setNewTags] = useState('');

  const isStaff = profile?.role === 'moderator' || profile?.role === 'admin';

  useEffect(() => {
    const stored = localStorage.getItem('studyys_library');
    if (stored) {
      setNotes(JSON.parse(stored));
    } else {
      setNotes(INITIAL_NOTES);
      localStorage.setItem('studyys_library', JSON.stringify(INITIAL_NOTES));
    }
  }, []);

  const handleUpvote = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, upvotes: n.upvotes + 1 } : n
    );
    setNotes(updated);
    localStorage.setItem('studyys_library', JSON.stringify(updated));
  };

  const handleDownloadMock = (id: string, title: string) => {
    // Increment download count
    const updated = notes.map((n) =>
      n.id === id ? { ...n, downloads: n.downloads + 1 } : n
    );
    setNotes(updated);
    localStorage.setItem('studyys_library', JSON.stringify(updated));

    // Mock text download
    const blob = new Blob([`Studyys Vetted Material\n\nTitle: ${title}\nThis is a mock study guide download.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_notes.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newSub) return;

    const newNote: SharedNote = {
      id: `n-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      semester: Number(newSem),
      branch: newBranch,
      subject: newSub,
      tags: newTags.split(',').map((t) => t.trim()).filter((t) => t !== ''),
      upvotes: 0,
      downloads: 0,
      status: isStaff ? 'approved' : 'pending', // Auto-approves if moderator upload
      user_name: profile?.full_name || 'Anonymous Student',
      created_at: new Date().toISOString().split('T')[0],
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('studyys_library', JSON.stringify(updated));

    // Close and reset
    setPublishModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewSub('');
    setNewTags('');

    alert(
      isStaff
        ? 'Notes published successfully!'
        : 'Notes submitted successfully! They will appear in the library once a Moderator approves them.'
    );
  };

  // Moderator actions
  const setNoteStatus = (id: string, status: 'approved' | 'rejected') => {
    const updated = notes.map((n) => (n.id === id ? { ...n, status } : n));
    setNotes(updated);
    localStorage.setItem('studyys_library', JSON.stringify(updated));
  };

  // Filters
  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                          n.description.toLowerCase().includes(search.toLowerCase()) ||
                          n.subject.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === 'All' || n.branch === branchFilter;
    const matchesSem = semFilter === 'All' || n.semester.toString() === semFilter;
    
    // Only show approved notes to students, moderators see pending too
    const matchesStatus = isStaff ? true : n.status === 'approved';

    return matchesSearch && matchesBranch && matchesSem && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FolderHeart className="w-7 h-7 text-brand-500" />
            <span>Shared Library</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Access, download, and review crowd-sourced, peer-reviewed engineering course resources.
          </p>
        </div>

        <button
          onClick={() => setPublishModal(true)}
          className="bg-gradient-brand text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow hover:shadow-lg active:scale-95 transition"
        >
          <Plus className="w-4.5 h-4.5" /> Publish Notes
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search notes, tags, or subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-205 dark:focus:ring-brand-500/30"
          />
        </div>

        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            <option value="All">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Communication">Electronics</option>
            <option value="Mechanical Engineering">Mechanical</option>
          </select>
        </div>

        <div>
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            <option value="All">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem.toString()}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Notes cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition relative overflow-hidden ${
              note.status === 'pending' ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10' : 'border-slate-200 dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            {note.status === 'pending' && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
                Review Queue
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  Sem {note.semester} &bull; {note.branch}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-505">{note.created_at}</span>
              </div>

              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-snug hover:text-brand-600 dark:hover:text-brand-400 transition">
                {note.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                {note.description}
              </p>

              <div className="flex flex-wrap gap-1 mt-4">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] bg-blue-50 text-brand-600 px-2 py-0.5 rounded-full border border-blue-100 dark:bg-blue-950/20 dark:text-brand-400 dark:border-blue-900/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 mt-6 pt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                Uploaded by: <span className="text-slate-600 dark:text-slate-300 font-bold">{note.user_name}</span>
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {note.status === 'pending' && isStaff ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setNoteStatus(note.id, 'approved')}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900/50"
                      title="Approve note"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setNoteStatus(note.id, 'rejected')}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded border border-red-200 dark:border-red-900/50"
                      title="Reject note"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpvote(note.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition"
                    >
                      <ThumbsUp className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {note.upvotes}
                    </button>
                    <button
                      onClick={() => handleDownloadMock(note.id, note.title)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-[10px] text-white hover:bg-slate-800 font-bold transition dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
                    >
                      <Download className="w-3 h-3" /> {note.downloads}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setPublishModal(false)} />
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-lg w-full relative z-10 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-105">Publish to Shared Library</h3>
              <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => setPublishModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Semaphores Practice Problems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Summarize the core topics covered in these notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none h-20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. mutex, semaphores"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Branch</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Communication">Electronics</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Semester</label>
                  <select
                    value={newSem}
                    onChange={(e) => setNewSem(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-205"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-brand text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:bg-brand-600 transition"
              >
                Submit Notes for Verification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

