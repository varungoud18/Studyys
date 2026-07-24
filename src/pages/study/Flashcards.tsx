import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateFlashcardsFromText, extractTopicsFromText } from '../../services/gemini';
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
  const { isMock, profile } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [sourceType, setSourceType] = useState<'pdf' | 'topic'>('pdf');
  const [customTopic, setCustomTopic] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isMock) {
      const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
      const stored = localStorage.getItem(filesKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDocuments(parsed);
        if (parsed.length > 0) {
          setSelectedDocId(parsed[0].id);
        } else {
          setSourceType('topic');
        }
      } else {
        setSourceType('topic');
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
          } else {
            setSourceType('topic');
          }
        } catch (err) {
          console.error('Error fetching supabase documents:', err);
          setSourceType('topic');
        }
      };
      fetchSupabaseDocs();
    }
  }, [isMock, profile]);

  // Dynamically load topics when document is selected
  useEffect(() => {
    if (!selectedDocId || sourceType !== 'pdf') return;

    const loadTopics = async () => {
      try {
        let fullText = '';
        if (isMock) {
          const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
          const stored = localStorage.getItem(filesKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const doc = parsed.find((d: any) => d.id === selectedDocId);
            if (doc && doc.extracted_text) {
              fullText = doc.extracted_text.map((p: any) => p.text).join('\n\n');
            }
          }
        } else {
          const { data: chunks } = await supabase
            .from('document_chunks')
            .select('chunk_text')
            .eq('document_id', selectedDocId);
          if (chunks) {
            fullText = chunks.map((c: any) => c.chunk_text).join('\n\n');
          }
        }

        const extracted = extractTopicsFromText(fullText);
        setTopics(extracted);
        if (extracted.length > 0) {
          setSelectedTopic(extracted[0]);
        }
      } catch (err) {
        console.error('Error loading topics:', err);
      }
    };

    loadTopics();
  }, [selectedDocId, documents, isMock, profile, sourceType]);

  useEffect(() => {
    if (!profile) return;

    if (isMock) {
      const flashcardsKey = `studyys_${profile.id}_flashcards`;
      const stored = localStorage.getItem(flashcardsKey);
      if (stored) {
        setCards(JSON.parse(stored));
      } else {
        setCards(DEFAULT_FLASHCARDS);
        localStorage.setItem(flashcardsKey, JSON.stringify(DEFAULT_FLASHCARDS));
      }
    } else {
      const fetchSupabaseCards = async () => {
        try {
          const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', profile.id);
          if (error) throw error;
          if (data && data.length > 0) {
            setCards(data.map((c: any) => ({
              id: c.id,
              topic: c.topic,
              question: c.question,
              answer: c.answer,
              isBookmarked: c.is_bookmarked,
              revisionCount: c.revision_count || 0
            })));
          } else {
            setCards(DEFAULT_FLASHCARDS);
          }
        } catch (err) {
          console.error('Error loading flashcards from Supabase:', err);
          setCards(DEFAULT_FLASHCARDS);
        }
      };
      fetchSupabaseCards();
    }
  }, [isMock, profile]);

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
    const card = cards[idx];
    if (!card) return;

    const newRevCount = card.revisionCount + 1;
    const updated = cards.map((c, i) =>
      i === idx ? { ...c, revisionCount: newRevCount } : c
    );
    setCards(updated);

    if (isMock) {
      if (profile) {
        const flashcardsKey = `studyys_${profile.id}_flashcards`;
        localStorage.setItem(flashcardsKey, JSON.stringify(updated));

        // 1 minute of study session per flashcard revision
        const sessionsKey = `studyys_${profile.id}_study_sessions`;
        const sessionsStored = localStorage.getItem(sessionsKey) || '[]';
        const sessionsList = JSON.parse(sessionsStored);
        sessionsList.unshift({
          id: `session-${Date.now()}`,
          duration_minutes: 1,
          activity_type: 'flashcard',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(sessionsKey, JSON.stringify(sessionsList));
      }
    } else {
      if (profile) {
        const updateSupabase = async () => {
          try {
            if (!card.id.startsWith('fc-gen') && !card.id.startsWith('fc-')) {
              await supabase
                .from('flashcards')
                .update({ revision_count: newRevCount })
                .eq('id', card.id);
            }

            // Also insert study session
            await supabase.from('study_sessions').insert({
              user_id: profile.id,
              duration_minutes: 1,
              activity_type: 'flashcard',
            });
          } catch (err) {
            console.error(err);
          }
        };
        updateSupabase();
      }
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const card = cards.find(c => c.id === id);
    if (!card) return;

    const newBookmarked = !card.isBookmarked;
    const updated = cards.map((c) =>
      c.id === id ? { ...c, isBookmarked: newBookmarked } : c
    );
    setCards(updated);

    if (isMock) {
      if (profile) {
        const flashcardsKey = `studyys_${profile.id}_flashcards`;
        localStorage.setItem(flashcardsKey, JSON.stringify(updated));
      }
    } else {
      if (profile && !id.startsWith('fc-gen') && !id.startsWith('fc-')) {
        const updateSupabase = async () => {
          try {
            await supabase
              .from('flashcards')
              .update({ is_bookmarked: newBookmarked })
              .eq('id', id);
          } catch (err) {
            console.error(err);
          }
        };
        updateSupabase();
      }
    }
  };

  const generateNewDeck = async (append = false) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      let contextText = '';
      const topicToGenerate = sourceType === 'pdf' ? selectedTopic : customTopic;
      
      if (sourceType === 'pdf') {
        const selectedDoc = documents.find((d) => d.id === selectedDocId);
        if (selectedDoc) {
          if (isMock) {
            const filesKey = profile ? `studyys_${profile.id}_files` : 'studyys_files';
            const stored = localStorage.getItem(filesKey);
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
        if (!contextText && selectedDoc) {
          contextText = `Generate flashcards for ${selectedDoc.title} in subject ${selectedDoc.subject}`;
        }
      } else {
        contextText = `Custom Topic: ${customTopic || 'General Computer Science'}`;
      }

      const generated = await generateFlashcardsFromText(contextText, topicToGenerate, 15);
      const mappedCards: Flashcard[] = generated.map((gc, index) => ({
        id: `fc-gen-${Date.now()}-${index}`,
        topic: gc.topic,
        question: gc.question,
        answer: gc.answer,
        isBookmarked: false,
        revisionCount: 0
      }));

      if (isMock) {
        if (profile) {
          const flashcardsKey = `studyys_${profile.id}_flashcards`;
          if (append) {
            const updated = [...cards, ...mappedCards];
            setCards(updated);
            localStorage.setItem(flashcardsKey, JSON.stringify(updated));
            setCurrentIdx(cards.length);
            setIsFlipped(false);
          } else {
            setCards(mappedCards);
            localStorage.setItem(flashcardsKey, JSON.stringify(mappedCards));
            setCurrentIdx(0);
            setIsFlipped(false);
          }
        }
      } else {
        if (profile) {
          const inserts = mappedCards.map(c => ({
            user_id: profile.id,
            document_id: sourceType === 'pdf' ? (selectedDocId || null) : null,
            question: c.question,
            answer: c.answer,
            topic: c.topic,
            is_bookmarked: c.isBookmarked,
            revision_count: c.revisionCount
          }));

          const { data, error } = await supabase
            .from('flashcards')
            .insert(inserts)
            .select('*');

          if (error) throw error;

          if (data) {
            const savedCards: Flashcard[] = data.map((c: any) => ({
              id: c.id,
              topic: c.topic,
              question: c.question,
              answer: c.answer,
              isBookmarked: c.is_bookmarked,
              revisionCount: c.revision_count || 0
            }));
            if (append) {
              setCards(prev => [...prev, ...savedCards]);
              setCurrentIdx(cards.length);
              setIsFlipped(false);
            } else {
              setCards(savedCards);
              setCurrentIdx(0);
              setIsFlipped(false);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to generate flashcards.');
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

        <div className="flex flex-col xl:flex-row xl:items-center gap-4 w-full xl:w-auto">
          {/* Source Type Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSourceType('pdf')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                sourceType === 'pdf'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Source PDF
            </button>
            <button
              onClick={() => setSourceType('topic')}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                sourceType === 'topic'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Custom Topic
            </button>
          </div>

          {sourceType === 'pdf' ? (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Document Dropdown */}
              <div className="w-full sm:w-52">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Select Source Document
                </label>
                {documents.length === 0 ? (
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-[10px] text-slate-500 dark:text-slate-400">
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

              {/* Topic Dropdown */}
              <div className="w-full sm:w-52">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Select Study Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={topics.length === 0}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                  {topics.map((top, idx) => (
                    <option key={idx} value={top}>
                      {top}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="w-full sm:w-80">
              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Custom Study Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Virtual Memory, Stack vs Heap..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs bg-white dark:bg-slate-850 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          )}

          <button
            onClick={() => generateNewDeck(false)}
            disabled={loading || (sourceType === 'pdf' ? (documents.length === 0 || topics.length === 0) : !customTopic.trim())}
            className="bg-gradient-brand text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50 mt-1 xl:mt-4"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {loading ? 'Recompiling...' : 'Generate 15 Cards'}
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
            Select a document & topic from the header or enter a Custom Topic, and click "Generate 15 Cards" to build a deck.
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

          {/* Generate 15 more cards button */}
          <button
            onClick={() => generateNewDeck(true)}
            disabled={loading}
            className="w-full bg-gradient-brand text-white font-bold py-3 rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Generate 15 More Cards for "{sourceType === 'pdf' ? selectedTopic : customTopic}"
          </button>
        </div>
      )}
    </div>
  );
};
