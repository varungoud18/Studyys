import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { CATEGORIZED_SUBJECTS, ALL_SUBJECTS, DEFAULT_SUBJECT } from '../../services/subjects';
import { extractTextFromPdf } from '../../services/pdfParser';
import {
  Upload as UploadIcon,
  FileText,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FolderOpen,
  ArrowUpDown,
} from 'lucide-react';

interface UploadedFile {
  id: string;
  title: string;
  file_size: number;
  subject: string;
  pages_count: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  extracted_text?: { pageNumber: number; text: string }[];
}

export const Upload: React.FC = () => {
  const { isMock, profile } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(DEFAULT_SUBJECT);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'title' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load files
  useEffect(() => {
    if (isMock) {
      const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
      const stored = localStorage.getItem(filesKey);
      if (stored) {
        setFiles(JSON.parse(stored));
      } else {
        // Pre-populate only for default mock profiles, start fresh for new mock profiles
        const isPreseeded = ['mock-student-id', 'mock-mod-id', 'mock-admin-id'].includes(profile?.id || '');
        const mockFiles: UploadedFile[] = isPreseeded ? [
          {
            id: 'doc-1',
            title: 'Operating Systems - Lecture Notes 4.pdf',
            file_size: 2516582, // 2.4 MB
            subject: 'Operating Systems',
            pages_count: 32,
            status: 'completed',
            created_at: new Date(Date.now() - 3600 * 2000).toISOString(),
          },
          {
            id: 'doc-2',
            title: 'Data Structures and Algorithms - Midterm Syllabus.pdf',
            file_size: 4300000,
            subject: 'Data Structures & Algorithms',
            pages_count: 18,
            status: 'completed',
            created_at: new Date(Date.now() - 3600 * 24000).toISOString(),
          },
        ] : [];
        setFiles(mockFiles);
        localStorage.setItem(filesKey, JSON.stringify(mockFiles));
      }
    } else {
      fetchSupabaseFiles();
    }
  }, [isMock, profile]);

  const fetchSupabaseFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setErrorMsg(null);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Check type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Invalid file format. Only PDF documents are allowed.');
      return;
    }
    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15 MB limit.');
      return;
    }
    // Check duplicates
    if (files.some((f) => f.title === file.name)) {
      setErrorMsg('A file with this name has already been uploaded.');
      return;
    }

    setLoading(true);

    try {
      // --- Step 1: Try to extract text (non-blocking — upload proceeds even if this fails) ---
      let extractedPages: { pageNumber: number; text: string }[] = [];
      try {
        extractedPages = await extractTextFromPdf(file);
      } catch (parseErr: any) {
        console.warn('[Upload] PDF text extraction failed, proceeding without text:', parseErr?.message);
        // Fallback: treat as a 1-page document with no text
        extractedPages = [{ pageNumber: 1, text: '' }];
      }

      if (isMock) {
        // Create Mock Document
        const newDocId = `doc-${Math.random().toString(36).substr(2, 9)}`;
        const newDoc: UploadedFile = {
          id: newDocId,
          title: file.name,
          file_size: file.size,
          subject: selectedSubject,
          pages_count: extractedPages.length,
          status: 'completed',
          created_at: new Date().toISOString(),
          extracted_text: extractedPages,
        };

        const updated = [newDoc, ...files];
        setFiles(updated);
        const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
        localStorage.setItem(filesKey, JSON.stringify(updated));
        setLoading(false);
      } else {
        // --- Step 2: Upload file to Supabase storage ---
        const filePath = `${profile?.id}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // --- Step 3: Insert document metadata into database ---
        const { data, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: profile?.id,
            title: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: 'application/pdf',
            subject_id: null,
            pages_count: extractedPages.length,
            status: 'completed',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // --- Step 4: Insert text chunks (skip if no text was extracted) ---
        const validChunks = extractedPages.filter(p => p.text.trim().length > 0);
        if (validChunks.length > 0) {
          const chunkInserts = validChunks.map((page, index) => ({
            document_id: data.id,
            chunk_index: index,
            chunk_text: page.text,
            page_number: page.pageNumber,
          }));

          const { error: chunkError } = await supabase
            .from('document_chunks')
            .insert(chunkInserts);

          if (chunkError) console.warn('[Upload] Chunk insert failed:', chunkError.message);
        }

        setFiles([data, ...files]);
      }
    } catch (err: any) {
      console.error('[Upload] Upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload PDF file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      if (isMock) {
        const filtered = files.filter((f) => f.id !== id);
        setFiles(filtered);
        const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
        localStorage.setItem(filesKey, JSON.stringify(filtered));
      } else {
        try {
          const fileToDelete = files.find((f) => f.id === id);
          if (fileToDelete) {
            // Delete from DB (cascade can handle storage or we clean manually)
            await supabase.from('documents').delete().eq('id', id);
            setFiles(files.filter((f) => f.id !== id));
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleSort = (field: 'title' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const filteredFiles = files
    .filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const compareA = a[sortField];
      const compareB = b[sortField];
      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Upload Study Material</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Add textbook sections, syllabi, or notes. Gemini will chunk and parse them for learning.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Upload Form</h3>
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-700 leading-normal">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                >
                  {Object.entries(CATEGORIZED_SUBJECTS).map(([category, subs]) => (
                    <optgroup key={category} label={category} className="dark:bg-slate-800 dark:text-slate-200">
                      {subs.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  dragging
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/30 dark:hover:bg-slate-800/10'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-brand-500 rounded-2xl mb-4">
                  <UploadIcon className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Drag & drop your PDF file here</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">or click to browse from device</p>
                <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-850 px-3 py-1 rounded-full">
                  PDF format &bull; Max 15 MB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Files Table list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-brand-500" />
                <span>Uploaded Documents ({files.length})</span>
              </h3>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search uploaded files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* List */}
            {filteredFiles.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No documents found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Upload a PDF using the form on the left to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold">
                      <th
                        className="pb-3 cursor-pointer hover:text-slate-600 dark:hover:text-slate-305"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center gap-1">
                          File Name <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                      <th className="pb-3">Subject</th>
                      <th className="pb-3">Pages</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 group transition">
                        <td className="py-4 font-semibold text-slate-800 dark:text-slate-205 max-w-xs truncate">
                          {file.title}
                        </td>
                        <td className="py-4 text-slate-500 dark:text-slate-400">{file.subject}</td>
                        <td className="py-4 text-slate-500 dark:text-slate-400">{file.pages_count}</td>
                        <td className="py-4 text-slate-500 dark:text-slate-400">{formatSize(file.file_size)}</td>
                        <td className="py-4">
                          {file.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                              <CheckCircle className="w-3 h-3" /> Ready
                            </span>
                          )}
                          {file.status === 'processing' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-950/20 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/50 animate-pulse">
                              <Clock className="w-3 h-3 animate-spin" /> Processing
                            </span>
                          )}
                          {file.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800/50">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button
                            className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition"
                            title="Preview File"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                            title="Delete File"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
