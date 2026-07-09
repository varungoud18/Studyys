import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const generateNewDeck = () => {
    setLoading(true);
    setTimeout(() => {
      // Create random cards matching standard CSE
      const newCards: Flashcard[] = [
        {
          id: `fc-gen-1`,
          topic: 'Compiler Design',
          question: 'What is a Lexical Analyzer (Scanner)?',
          answer: 'The scanner reads the source program characters and groups them into meaningful sequences called lexemes, which are then categorized into grammatical tokens (e.g. keywords, identifiers, operators).',
          isBookmarked: false,
          revisionCount: 0,
        },
        {
          id: `fc-gen-2`,
          topic: 'Database Systems',
          question: 'What are the properties of ACID in transaction management?',
          answer: 'Atomicity (all or nothing), Consistency (preserves database integrity), Isolation (concurrent transactions execute independently), Durability (completed transactions survive crashes).',
          isBookmarked: false,
          revisionCount: 0,
        },
      ];
      setCards(newCards);
      localStorage.setItem('studyys_flashcards', JSON.stringify(newCards));
      setCurrentIdx(0);
      setIsFlipped(false);
      setLoading(false);
    }, 1500);
  };

  if (cards.length === 0) return null;

  const currentCard = cards[currentIdx];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-500" />
            <span>Smart Flashcards</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Active recall review decks generated automatically from your textbooks.
          </p>
        </div>

        <button
          onClick={generateNewDeck}
          disabled={loading}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          {loading ? 'Recompiling Decks...' : 'Generate New Deck'}
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-700">Synthesizing decks using Gemini...</p>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Tracker Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <span className="text-xs text-slate-400 font-semibold">
              Deck Progress: <span className="text-slate-700 font-bold">{currentIdx + 1} / {cards.length}</span>
            </span>
            <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
              Revisions: {currentCard.revisionCount}
            </span>
          </div>

          {/* Flashcard Component */}
          <div
            onClick={handleFlip}
            className="h-80 w-full perspective-1000 cursor-pointer group"
          >
            <div
              className={`relative w-full h-full transform-style-3d transition-transform duration-500 shadow-md rounded-2xl border border-slate-200 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 bg-white rounded-2xl p-8 flex flex-col justify-between backface-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] bg-blue-50 text-brand-600 font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                    {currentCard.topic}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(currentCard.id, e)}
                    className="text-slate-400 hover:text-amber-500 transition"
                  >
                    {currentCard.isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <div className="my-auto space-y-4">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center">
                    <HelpCircle className="w-4 h-4 text-slate-300" /> Question
                  </span>
                  <p className="text-base md:text-lg font-black text-slate-800 text-center leading-normal">
                    {currentCard.question}
                  </p>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-semibold">
                  Click card to reveal explanation
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 bg-[#fafcff] rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 border-t-4 border-brand-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] bg-brand-500 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Answer Key
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(currentCard.id, e)}
                    className="text-slate-400 hover:text-amber-500 transition"
                  >
                    {currentCard.isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="my-auto overflow-y-auto max-h-48 scrollbar-thin pr-1 py-2">
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-semibold">
                  Click card to hide answer
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-6 px-4">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-xl disabled:opacity-40 transition shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-xs text-slate-400 font-medium italic">
              Try to recall before checking the back!
            </div>

            <button
              onClick={handleNext}
              disabled={currentIdx === cards.length - 1}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 p-3 rounded-xl disabled:opacity-40 transition shadow-sm active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
