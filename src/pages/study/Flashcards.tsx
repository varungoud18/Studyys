import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateFlashcardsFromText } from '../../services/gemini';
import { supabase } from '../../services/supabase';
import {
  Layers,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  isBookmarked: boolean;
  revisionCount: number;
}

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    topic: 'Operating Systems',
    question: 'What is the primary difference between a process and a thread?',
    answer: 'A process is an independent execution unit with its own virtual memory space and resources allocated by the OS. A thread is a subset of a process that shares the parent process\'s address space, code, data, and resources, enabling lightweight concurrency.',
    isBookmarked: false,
    revisionCount: 2,
  },
  {
    id: 'fc-2',
    topic: 'Data Structures',
    question: 'How does a Red-Black Tree guarantee O(log N) operations?',
    answer: 'By enforcing self-balancing properties: 1. Every node is red or black. 2. Root is black. 3. Red nodes cannot have red children. 4. Equal number of black nodes in all paths from root to leaves. This limits the maximum tree height to 2 * log(N+1).',
    isBookmarked: true,
    revisionCount: 4,
  },
  {
    id: 'fc-3',
    topic: 'Computer Networks',
    question: 'What is the purpose of the Sliding Window Protocol?',
    answer: 'It is a flow control method used in transport layer protocols (like TCP) to regulate the sender\'s data stream. It allows the sender to transmit multiple data packets before receiving an acknowledgment, optimizing network throughput.',
    isBookmarked: false,
    revisionCount: 1,
  },
];

export const Flashcards: React.FC = () => {
  const { isMock } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isMock) {
      const stored = localStorage.getItem('studyys_files');
      if (stored) {
        const parsed = JSON.parse(stored);
        setDocuments(parsed);
        if (parsed.length > 0) {
          setSelectedDocId(parsed[0].id);
        }
      }
    } else {
      const fetchSupabaseDocs = async () => {
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('id, title, subject_id, subjects (name)')
            .eq('status', 'completed');
          if (error) throw error;
          if (data && data.length > 0) {
            const docsList = data.map((d: any) => ({
              id: d.id,
              title: d.title,
              subject: d.subjects?.name || 'Engineering',
            }));
            setDocuments(docsList);
            setSelectedDocId(docsList[0].id);
          }
        } catch (err) {
          console.error('Error fetching supabase documents:', err);
        }
      };
      fetchSupabaseDocs();
    }
  }, [isMock]);

  useEffect(() => {
    // Load flashcards from localstorage or use defaults
    const stored = localStorage.getItem('studyys_flashcards');
    if (stored) {
      setCards(JSON.parse(stored));
    } else {
      setCards(DEFAULT_FLASHCARDS);
      localStorage.setItem('studyys_flashcards', JSON.stringify(DEFAULT_FLASHCARDS));
    }
  }, []);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIdx < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1);
        incrementRevision(currentIdx + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx(currentIdx - 1);
        incrementRevision(currentIdx - 1);
      }, 150);
    }
  };

  const incrementRevision = (idx: number) => {
    const updated = cards.map((c, i) =>
      i === idx ? { ...c, revisionCount: c.revisionCount + 1 } : c
    );
    setCards(updated);
    localStorage.setItem('studyys_flashcards', JSON.stringify(updated));
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = cards.map((c) =>
      c.id === id ? { ...c, isBookmarked: !c.isBookmarked } : c
    );
    setCards(updated);
    localStorage.setItem('studyys_flashcards', JSON.stringify(updated));
  };

  const generateNewDeck = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      let contextText = '';
      const selectedDoc = documents.find((d) => d.id === selectedDocId);
      if (selectedDoc) {
        if (isMock) {
          const stored = localStorage.getItem('studyys_files');
          if (stored) {
            const parsed = JSON.parse(stored);
            const doc = parsed.find((d: any) => d.id === selectedDocId);
            if (doc && doc.extracted_text) {
              contextText = doc.extracted_text.map((p: any) => p.text).join('\n\n');
            }
          }
        } else {
          const { data: chunks } = await supabase
            .from('document_chunks')
            .select('chunk_text')
            .eq('document_id', selectedDocId);
          if (chunks) {
            contextText = chunks.map((c: any) => c.chunk_text).join('\n\n');
          }
        }
      }

      if (!contextText) {
        contextText = selectedDoc ? `Generate flashcards for ${selectedDoc.title} in subject ${selectedDoc.subject}` : 'General Computer Science, Math, and Physics';
      }

      const generated = await generateFlashcardsFromText(contextText);
      const mappedCards: Flashcard[] = generated.map((gc, index) => ({
        id: `fc-gen-${Date.now()}-${index}`,
        topic: gc.topic,
        question: gc.question,
        answer: gc.answer,
        isBookmarked: false,
        revisionCount: 0
      }));

      setCards(mappedCards);
      localStorage.setItem('studyys_flashcards', JSON.stringify(mappedCards));
      setCurrentIdx(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to generate flashcards from the selected document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-500" />
            <span>AI Flashcards</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Generate and review smart study cards generated from your courses.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-60">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Select Source Document
            </label>
            {documents.length === 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                No documents. Upload a PDF first.
              </div>
            ) : (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.subject})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={generateNewDeck}
            disabled={loading || documents.length === 0}
            className="bg-gradient-brand text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50 mt-4 sm:mt-5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {loading ? 'Recompiling...' : 'Generate Cards'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold max-w-xl mx-auto">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-sm">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 animate-pulse">Drafting flashcards using Gemini...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No Flashcards Yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            Select a document from the header dropdown and click "Generate Cards" to build a deck.
          </p>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 dark:text-slate-200 font-bold">Active Flashcard Deck</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                {cards.length} cards
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Card {currentIdx + 1} of {cards.length}
            </span>
          </div>

          <div className="w-full h-80 perspective-1000 cursor-pointer" onClick={handleFlip}>
            <div
              className={`relative w-full h-full transform-style-3d transition-transform duration-500 shadow-md rounded-2xl border border-slate-200 dark:border-slate-800 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col justify-between backface-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-brand-650 dark:text-brand-400 font-bold px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 uppercase tracking-wider">
                    {cards[currentIdx].topic}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(cards[currentIdx].id, e)}
                    className="text-slate-400 hover:text-amber-500 transition animate-pulse-slow"
                  >
                    {cards[currentIdx].isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <div className="flex-1 flex items-center justify-center py-4">
                  <p className="text-base md:text-lg font-black text-slate-805 dark:text-slate-100 text-center leading-normal">
                    {cards[currentIdx].question}
                  </p>
                </div>

                <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                  Click card to reveal answer
                </div>
              </div>

              <div className="absolute inset-0 bg-[#fafcff] dark:bg-slate-900 rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 border-t-4 border-brand-500">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Answer</span>
                  <button
                    onClick={(e) => toggleBookmark(cards[currentIdx].id, e)}
                    className="text-slate-400 hover:text-amber-500 transition"
                  >
                    {cards[currentIdx].isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center py-4 overflow-y-auto scrollbar-thin">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cards[currentIdx].answer}
                  </p>
                </div>

                <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                  Click card to view front
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-805 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-xl disabled:opacity-40 transition shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleFlip}
              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl text-xs shadow-sm transition active:scale-95"
            >
              Flip Card
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === cards.length - 1}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-805 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-xl disabled:opacity-40 transition shadow-sm active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
