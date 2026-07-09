import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { askGemini } from '../../services/gemini';
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
  const { isMock } = useAuth();
  const [subject, setSubject] = useState<'os' | 'dsa'>('os');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'result'>('config');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  const startQuiz = () => {
    setQuizState('loading');
    setTimeout(() => {
      setQuestions(MOCK_QUESTIONS[subject]);
      setSelectedAnswers({});
      setCurrentIdx(0);
      setQuizState('active');
    }, 1200);
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
    // Calculate Score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_option_index) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setQuizState('result');

    // Log attempt history
    const storedHistory = localStorage.getItem('studyys_history') || '[]';
    const historyList = JSON.parse(storedHistory);
    historyList.unshift({
      id: `quiz-hist-${Date.now()}`,
      type: 'Quiz Attempt',
      title: `${subject === 'os' ? 'Operating Systems' : 'Data Structures'} Quiz`,
      detail: `Scored ${finalScore}% (${correctCount}/${questions.length} correct)`,
      subject: subject === 'os' ? 'Operating Systems' : 'Data Structures',
      date: new Date().toLocaleDateString(),
    });
    localStorage.setItem('studyys_history', JSON.stringify(historyList));
  };

  const resetQuiz = () => {
    setQuizState('config');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-brand-500" />
          <span>AI Quiz Generator</span>
        </h2>
        <p className="text-slate-500 text-sm">
          Generate custom questions to evaluate your engineering course knowledge.
        </p>
      </div>

      {quizState === 'config' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-xl mx-auto shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="p-4 bg-blue-50 text-brand-500 rounded-full inline-block">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Generate Exam</h3>
            <p className="text-xs text-slate-400">Configure parameters for your exam simulator</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Course Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as 'os' | 'dsa')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
              >
                <option value="os">Operating Systems</option>
                <option value="dsa">Data Structures & Algorithms</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition ${
                      difficulty === lvl
                        ? 'bg-brand-50 text-brand-600 border-brand-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-gradient-brand text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 text-sm"
            >
              <span>Generate Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {quizState === 'loading' && (
        <div className="py-24 flex flex-col items-center justify-center max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="relative w-14 h-14 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-700 animate-pulse">Assembling MCQs using Gemini...</p>
          <p className="text-xs text-slate-400 mt-1">Applying difficulty rules and explanations...</p>
        </div>
      )}

      {quizState === 'active' && questions.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Question Index details */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Question</span>
              <span className="font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded text-xs">
                {currentIdx + 1}/{questions.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-4 h-4" /> <span>Timer active</span>
            </div>
          </div>

          {/* Question Body */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 leading-normal">
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
                        ? 'bg-brand-50 border-brand-400 text-brand-700 font-semibold shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm text-center space-y-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-full inline-block">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Quiz Completed!</h3>
              <p className="text-slate-400 text-xs mt-1">Excellent work evaluating your understanding</p>
            </div>
            
            <div className="text-5xl font-black text-slate-800 tracking-tight py-2">
              {score}%
            </div>

            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your results have been synced to your dashboard and study history metrics.
            </p>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={resetQuiz}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" /> Retry Quiz
              </button>
            </div>
          </div>

          {/* Question Review Accordions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Performance Review
            </h4>

            <div className="space-y-6 divide-y divide-slate-100">
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
                        <p className="text-sm font-bold text-slate-800">
                          {qIdx + 1}. {q.question_text}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 text-xs">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                        <span className="font-bold">Correct Answer:</span>
                        <p className="mt-1">{q.options[q.correct_option_index]}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${
                        isCorrect
                          ? 'bg-slate-50 border-slate-100 text-slate-600'
                          : 'bg-red-50 border-red-100 text-red-800'
                      }`}>
                        <span className="font-bold">Your Selection:</span>
                        <p className="mt-1">
                          {userAns !== undefined ? q.options[userAns] : 'No answer selected'}
                        </p>
                      </div>
                    </div>

                    <div className="pl-8 text-xs bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Academic Explanation:
                      </span>
                      <p className="text-slate-500 mt-1 leading-relaxed">{q.explanation}</p>
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
