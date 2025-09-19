import React from 'react';
import type { Question } from '../types';

interface QuestionCardProps {
  questionData: Question;
  onAnswer: (selectedOption: string) => void;
  selectedAnswer: string | null;
  isAnswered: boolean;
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, onAnswer, selectedAnswer, isAnswered }) => {
  const { question, options, correctAnswer, explanation } = questionData;

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return "bg-white hover:bg-indigo-50 border-gray-300 hover:border-indigo-400 text-gray-700";
    }
    if (option === correctAnswer) {
      return "bg-green-100 border-green-500 text-green-800 font-semibold";
    }
    if (option === selectedAnswer) {
      return "bg-red-100 border-red-500 text-red-800";
    }
    return "bg-gray-100 border-gray-300 opacity-70 cursor-not-allowed";
  };
  
  const getIcon = (option: string) => {
    if (!isAnswered) return null;
    if (option === correctAnswer) return <CheckIcon />;
    if (option === selectedAnswer) return <XIcon />;
    return null;
  }

  return (
    <div className="bg-white shadow-xl rounded-xl p-6 md:p-8 w-full max-w-4xl mx-auto border border-gray-200">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: question }}></h2>
      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(option)}
            disabled={isAnswered}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-md md:text-lg flex items-center justify-between ${getButtonClass(option)}`}
          >
            <div className="flex items-start">
              <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
              <span dangerouslySetInnerHTML={{ __html: option }}></span>
            </div>
            <div className="w-6 h-6 ml-4">{getIcon(option)}</div>
          </button>
        ))}
      </div>
      {isAnswered && (
        // FIX: The `animate-fade-in` class was removed because the non-standard <style jsx> tag that defined it caused an error and was deleted.
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Penjelasan:</h3>
          </div>
          <p className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation }}></p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
