import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateQuizFromText, QuizQuestion } from '../../services/gemini';
import { supabase } from '../../services/supabase';
import {
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Brain,
} from 'lucide-react';

interface Question {
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

const MOCK_QUESTIONS: Record<string, Question[]> = {
  os: [
    {
      question_text: 'What is a race condition in operating systems?',
      options: [
        'A condition where two threads run on different CPUs simultaneously.',
        'A situation where multiple threads write to the same memory space concurrently, leading to unpredictable outcomes.',
        'A scheduling optimization technique for batch threads.',
        'An instruction set level hardware error.',
      ],
      correct_option_index: 1,
      explanation: 'A race condition occurs when the output is dependent on the sequence or timing of uncontrollable concurrent events, especially when writing to shared data.',
    },
    {
      question_text: 'Which scheduling algorithm is prone to starvation?',
      options: [
        'Round Robin (RR)',
        'First-Come First-Served (FCFS)',
        'Shortest Job First (SJF) non-preemptive',
        'Priority Scheduling (without aging)',
      ],
      correct_option_index: 3,
      explanation: 'Priority scheduling without aging can cause starvation, where low-priority jobs wait indefinitely because high-priority processes keep arriving.',
    },
  ],
  dsa: [
    {
      question_text: 'What is the worst-case time complexity of searching in a Hash Table?',
      options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
      correct_option_index: 2,
      explanation: 'In the worst case (when all elements hash to the same bucket causing collision), searching takes O(N) where N is the number of elements.',
    },
    {
      question_text: 'Which traversal of a Binary Search Tree (BST) yields sorted order?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
      correct_option_index: 1,
      explanation: 'In-order traversal visits left-child, node, and then right-child, which naturally extracts values from BST in sorted ascending order.',
    },
  ],
};

export const Quiz: React.FC = () => {
  const { isMock, profile } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [sourceType, setSourceType] = useState<'pdf' | 'topic'>('pdf');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'result'>('config');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
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
              subject_id: d.subject_id,
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

  const startQuiz = async () => {
    setErrorMsg(null);
    setQuizState('loading');

    try {
      let contextText = '';
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
          contextText = `Generate quiz about ${selectedDoc.title} in subject ${selectedDoc.subject}`;
        }
      } else {
        contextText = `Custom Topic: ${customTopic || 'General Computer Science'}`;
      }

      const generated = await generateQuizFromText(contextText, difficulty, 15);
      setQuestions(generated);
      setSelectedAnswers({});
      setCurrentIdx(0);
      setQuizState('active');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to generate quiz. Please verify your connection/API key and try again.');
      setQuizState('config');
    }
  };

  const loadMoreQuestions = async () => {
    setErrorMsg(null);
    setQuizState('loading');

    try {
      let contextText = '';
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
          contextText = `Generate quiz about ${selectedDoc.title} in subject ${selectedDoc.subject}`;
        }
      } else {
        contextText = `Custom Topic: ${customTopic || 'General Computer Science'}`;
      }

      const generated = await generateQuizFromText(contextText, difficulty, 15);
      const updatedQuestions = [...questions, ...generated];
      setQuestions(updatedQuestions);
      setCurrentIdx(questions.length); // Start at first new question
      setQuizState('active');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to generate additional questions.');
      setQuizState('result');
    }
  };

  const handleSelectAnswer = (optionIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIdx]: optionIdx,
    });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_option_index) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setQuizState('result');

    const selectedDoc = documents.find((d) => d.id === selectedDocId);

    // Save attempts for dashboard stats
    if (isMock) {
      if (profile) {
        // Log attempt history
        const histKey = `studyys_${profile.id}_history`;
        const storedHistory = localStorage.getItem(histKey) || '[]';
        const historyList = JSON.parse(storedHistory);
        historyList.unshift({
          id: `quiz-hist-${Date.now()}`,
          type: 'Quiz Attempt',
          title: `${selectedDoc?.title || 'General'} Quiz`,
          detail: `Scored ${finalScore}% (${correctCount}/${questions.length} correct)`,
          subject: selectedDoc?.subject || 'Engineering',
          date: new Date().toLocaleDateString(),
        });
        localStorage.setItem(histKey, JSON.stringify(historyList));

        // Save attempt details for score calculation
        const attemptsKey = `studyys_${profile.id}_quiz_attempts`;
        const attemptsStored = localStorage.getItem(attemptsKey) || '[]';
        const attemptsList = JSON.parse(attemptsStored);
        attemptsList.unshift({
          id: `attempt-${Date.now()}`,
          score: finalScore,
          totalQuestions: questions.length,
          date: new Date().toISOString(),
        });
        localStorage.setItem(attemptsKey, JSON.stringify(attemptsList));

        // Save automatic study session duration (20 minutes per quiz)
        const sessionsKey = `studyys_${profile.id}_study_sessions`;
        const sessionsStored = localStorage.getItem(sessionsKey) || '[]';
        const sessionsList = JSON.parse(sessionsStored);
        sessionsList.unshift({
          id: `session-${Date.now()}`,
          duration_minutes: 20,
          activity_type: 'quiz',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(sessionsKey, JSON.stringify(sessionsList));
      }
    } else {
      if (profile) {
        // Real Supabase persistence
        const saveSupabaseAttempt = async () => {
          try {
            // First, check or insert into quizzes to satisfy the foreign key constraint
            const { data: quizData, error: quizError } = await supabase
              .from('quizzes')
              .insert({
                creator_id: profile.id,
                title: `${selectedDoc?.title || 'General'} Quiz`,
                description: `Difficulty: ${difficulty}`,
                subject_id: selectedDoc?.subject_id || null,
                difficulty: difficulty
              })
              .select('id')
              .single();

            if (quizError) throw quizError;

            // Now insert the attempt
            await supabase.from('quiz_attempts').insert({
              user_id: profile.id,
              quiz_id: quizData.id,
              score: finalScore,
              total_questions: questions.length,
            });

            // Also insert study session
            await supabase.from('study_sessions').insert({
              user_id: profile.id,
              subject_id: selectedDoc?.subject_id || null,
              duration_minutes: 20,
              activity_type: 'quiz',
            });
          } catch (err) {
            console.error('Error saving quiz attempt to Supabase:', err);
          }
        };
        saveSupabaseAttempt();
      }
    }
  };

  const resetQuiz = () => {
    setQuizState('config');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-brand-500" />
          <span>AI Quiz Generator</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Generate custom questions to evaluate your engineering course knowledge.
        </p>
      </div>

      {quizState === 'config' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 max-w-xl mx-auto shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-brand-500 rounded-full inline-block">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Generate Exam</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Configure parameters for your exam simulator</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Quiz Source
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSourceType('pdf')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    sourceType === 'pdf'
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-500/30'
                      : 'bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  Uploaded PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('topic')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    sourceType === 'topic'
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-500/30'
                      : 'bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  Custom Topic
                </button>
              </div>
            </div>

            {sourceType === 'pdf' ? (
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Reference Document
                </label>
                {documents.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                    No documents available. Please upload a PDF or choose 'Custom Topic'.
                  </div>
                ) : (
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.subject})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Custom Study Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures, OS Concepts, Computer Networks..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition ${
                      difficulty === lvl
                        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-300 dark:border-brand-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={sourceType === 'pdf' ? documents.length === 0 : !customTopic.trim()}
              className="w-full bg-gradient-brand text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <span>Generate Quiz (15 MCQs)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {quizState === 'loading' && (
        <div className="py-24 flex flex-col items-center justify-center max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="relative w-14 h-14 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 animate-pulse">Assembling MCQs using Gemini...</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Applying difficulty rules and explanations...</p>
        </div>
      )}

      {quizState === 'active' && questions.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Question Index details */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">Question</span>
              <span className="font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded text-xs">
                {currentIdx + 1}/{questions.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="w-4 h-4" /> <span>Timer active</span>
            </div>
          </div>

          {/* Question Body */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-normal">
              {questions[currentIdx].question_text}
            </h3>

            <div className="space-y-3">
              {questions[currentIdx].options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectAnswer(oIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-400 dark:border-brand-500/50 text-brand-700 dark:text-brand-400 font-semibold shadow-sm'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-305'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentIdx] === undefined}
              className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              <span>{currentIdx === questions.length - 1 ? 'Finish Exam' : 'Next Question'}</span>
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {quizState === 'result' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Results Summary banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm text-center space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-full inline-block">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Quiz Completed!</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Excellent work evaluating your understanding</p>
            </div>
            
            <div className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight py-2">
              {score}%
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your results have been synced to your dashboard and study history metrics.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={resetQuiz}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" /> Reset Settings
              </button>
              <button
                onClick={loadMoreQuestions}
                className="bg-gradient-brand text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Brain className="w-4 h-4" /> Generate 15 More Questions
              </button>
            </div>
          </div>

          {/* Question Review Accordions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-850 pb-3">
              Performance Review
            </h4>

            <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
              {questions.map((q, qIdx) => {
                const userAns = selectedAnswers[qIdx];
                const isCorrect = userAns === q.correct_option_index;

                return (
                  <div key={qIdx} className={`pt-6 ${qIdx === 0 ? 'pt-0' : ''} space-y-3`}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {qIdx + 1}. {q.question_text}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 text-xs">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-400">
                        <span className="font-bold">Correct Answer:</span>
                        <p className="mt-1">{q.options[q.correct_option_index]}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${
                        isCorrect
                          ? 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-350'
                          : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-305'
                      }`}>
                        <span className="font-bold">Your Selection:</span>
                        <p className="mt-1">
                          {userAns !== undefined ? q.options[userAns] : 'No answer selected'}
                        </p>
                      </div>
                    </div>

                    <div className="pl-8 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl">
                      <span className="font-bold text-slate-700 dark:text-slate-305 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Academic Explanation:
                      </span>
                      <p className="text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
