import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { CheckCircle, XCircle, Clock, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { Course } from '../types';

interface QuizViewProps {
  quizId: string;
}

const QuizView: React.FC<QuizViewProps> = ({ quizId }) => {
  const { quizzes, updateQuizScore, navigate, documents } = useAppStore();
  const quiz = quizzes.find(q => q.id === quizId);
  const document = documents.find(d => d.id === quiz?.pdfId);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!quiz || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, isFinished]);

  if (!quiz) return <div>Quiz not found</div>;

  const currentQuestion = quiz.questions[currentQuestionIdx];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const submitAnswer = () => {
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    // Calculate final score if this was the last question step
    let finalScore = score;
    // Note: If we just clicked "Next" on the last question, score is already updated.
    
    const percentage = Math.round((finalScore / quiz.questions.length) * 100);
    updateQuizScore(quizId, percentage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-6 overflow-y-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-6 text-medical-600">
            <Award size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
          <p className="text-slate-500 mb-6">You tested on {document?.name}</p>
          
          <div className="text-5xl font-black text-medical-600 mb-2">{percentage}%</div>
          <p className="text-sm text-slate-400 mb-8">
            You got {score} out of {quiz.questions.length} correct
          </p>

          <div className="flex gap-4">
            <button 
              onClick={() => navigate({ type: 'READER', pdfId: quiz.pdfId })}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Review PDF
            </button>
            <button 
              onClick={() => navigate({ type: 'DASHBOARD' })}
              className="flex-1 py-3 px-4 rounded-xl bg-medical-600 text-white hover:bg-medical-700 font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col max-w-4xl mx-auto p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-8 shrink-0">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800">Quiz Mode</h2>
          <p className="text-slate-500 text-xs md:text-sm truncate max-w-[200px] md:max-w-none">{document?.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-mono text-sm">
          <Clock size={16} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-6 shrink-0">
        <div 
          className="bg-medical-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIdx) / quiz.questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex-1 overflow-y-auto">
        <span className="text-xs font-bold text-medical-600 bg-medical-50 px-2 py-1 rounded-md uppercase tracking-wide">
          Question {currentQuestionIdx + 1} of {quiz.questions.length}
        </span>
        <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mt-4 mb-6 md:mb-8 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let stateClass = "border-slate-200 hover:border-medical-300 hover:bg-medical-50";
            if (isAnswered) {
              if (idx === currentQuestion.correctAnswer) stateClass = "border-green-500 bg-green-50 text-green-700";
              else if (idx === selectedOption) stateClass = "border-red-500 bg-red-50 text-red-700";
              else stateClass = "border-slate-100 text-slate-400";
            } else if (selectedOption === idx) {
              stateClass = "border-medical-600 bg-medical-50 ring-1 ring-medical-600";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${stateClass}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5
                  ${isAnswered && idx === currentQuestion.correctAnswer ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'}
                `}>
                  {isAnswered && idx === currentQuestion.correctAnswer && <CheckCircle size={14} />}
                  {isAnswered && idx === selectedOption && idx !== currentQuestion.correctAnswer && <XCircle size={14} className="text-red-500" />}
                </div>
                <span className="text-base md:text-lg">{option}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-8 bg-slate-50 border border-slate-200 p-6 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <h4 className="font-bold text-slate-800 mb-2">Explanation</h4>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">{currentQuestion.explanation}</p>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={nextQuestion}
                className="bg-medical-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-medical-700 flex items-center gap-2 text-sm md:text-base"
              >
                {currentQuestionIdx === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {!isAnswered && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={submitAnswer}
              disabled={selectedOption === null}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
            >
              Submit Answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;