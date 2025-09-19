
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Question, QuestionCategory } from './types';
import QuestionCard from './components/QuestionCard';
import LoadingSpinner from './components/LoadingSpinner';
import { generateCPNSQuestion } from './services/geminiService';
import { SKB_FIELDS } from './constants';

const TOP_LEVEL_CATEGORIES: ('TWK' | 'TIU' | 'TKP')[] = ['TWK', 'TIU', 'TKP'];
const API_KEY_STORAGE_KEY = 'cpns-ai-gemini-api-key';

// --- API Key Modal Component ---
interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentKey: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeyInput(currentKey || '');
    }
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (keyInput.trim()) {
      onSave(keyInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 md:p-8 transform transition-all animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">API Key Diperlukan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Aplikasi ini memerlukan Google Gemini API Key. Dapatkan kunci Anda dari{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
            Google AI Studio
          </a>.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-700 mb-1">
              Gemini API Key
            </label>
            <input
              id="apiKeyInput"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Masukkan API Key Anda di sini"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!keyInput.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/50"
          >
            Simpan & Mulai Latihan
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [appState, setAppState] = useState<'welcome' | 'main'>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSkbDropdownOpen, setIsSkbDropdownOpen] = useState(false);
  const skbDropdownRef = useRef<HTMLDivElement>(null);
  const fetchingNextRef = useRef(false);

  const skbButtonText = useMemo(() => {
    if (category?.startsWith('SKB - ')) {
      return category.replace('SKB - ', '');
    }
    return 'SKB';
  }, [category]);
  
  useEffect(() => {
    try {
        const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedKey) {
            setApiKey(savedKey);
        }
    } catch (e) {
        console.error("Could not access local storage", e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (skbDropdownRef.current && !skbDropdownRef.current.contains(event.target as Node)) {
            setIsSkbDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchQuestion = useCallback(async () => {
    if (!apiKey) {
      setError('API Key belum diatur. Silakan atur di menu Pengaturan.');
      return null;
    }
    if (!category) {
        // This case should ideally not be hit if called correctly
        setError('Kategori belum dipilih.');
        return null;
    }
    setError(null);
    try {
      return await generateCPNSQuestion(category, apiKey);
    } catch (err) {
      console.error(err);
       if (err instanceof Error && (err.message.includes('API key not valid') || err.message.includes('permission denied'))) {
        setError('API Key tidak valid. Silakan periksa kembali.');
        setApiKey(null);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setIsApiKeyModalOpen(true);
      } else {
        setError('Gagal memuat soal baru. Periksa koneksi atau API Key Anda.');
      }
      return null;
    }
  }, [category, apiKey]);

  const fetchNextQuestionInBackground = useCallback(async () => {
    if (fetchingNextRef.current) return;
    fetchingNextRef.current = true;
    setIsFetchingNext(true);
    try {
        const question = await fetchQuestion();
        setNextQuestion(question);
    } finally {
        setIsFetchingNext(false);
        fetchingNextRef.current = false;
    }
  }, [fetchQuestion]);

  const loadInitialQuestions = useCallback(async () => {
    if (!category) return;
    setIsLoading(true);
    setError(null);
    const firstQuestion = await fetchQuestion();
    setCurrentQuestion(firstQuestion);
    if(firstQuestion) {
       fetchNextQuestionInBackground();
    }
    setIsLoading(false);
  }, [category, fetchQuestion, fetchNextQuestionInBackground]);
  
  useEffect(() => {
    if (apiKey && category) {
      loadInitialQuestions();
    }
  }, [category, apiKey, loadInitialQuestions]);


  const handleAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setQuestionsAnswered(prev => prev + 1);
    if (answer === currentQuestion?.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };
  
  const handleNextQuestion = () => {
    if (isFetchingNext) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
          setNextQuestion(null); // Clear next question
          fetchNextQuestionInBackground(); // Pre-fetch the one after
      } else {
          // Fallback if pre-fetching failed or was slow
          loadInitialQuestions();
      }
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsTransitioning(false);
    }, 300);
  };
  
  const handleCategoryChange = (newCategory: QuestionCategory) => {
    if(newCategory === category) return;
    
    if (!newCategory.startsWith('SKB')) {
      setIsSkbDropdownOpen(false);
    }

    setCategory(newCategory);
    setCurrentQuestion(null);
    setNextQuestion(null);
    setScore(0);
    setQuestionsAnswered(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setError(null);
  };

  const handleSkbCategoryChange = (field: string) => {
    handleCategoryChange(`SKB - ${field}`);
    setIsSkbDropdownOpen(false);
  };
  
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setIsApiKeyModalOpen(false);
    // If a category is already selected, start loading questions.
    if(category){
        loadInitialQuestions();
    }
  };

  const scorePercentage = useMemo(() => {
    if (questionsAnswered === 0) return 0;
    return Math.round((score / questionsAnswered) * 100);
  }, [score, questionsAnswered]);
  
  const handleStart = () => {
      setAppState('main');
      if (!apiKey) {
          setIsApiKeyModalOpen(true);
      }
  };

  const renderContent = () => {
    if (!category && apiKey) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-md w-full max-w-2xl animate-fade-in">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Siap untuk Memulai?</h2>
                <p className="text-gray-600">Silakan pilih kategori soal di atas untuk memulai sesi latihan Anda.</p>
            </div>
        )
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-slate-500 h-96">
          <LoadingSpinner className="h-10 w-10 text-indigo-600" />
          <p className="mt-4 text-lg">Mempersiapkan soal untuk Anda...</p>
        </div>
      );
    }

    if (error) {
       return (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center w-full max-w-4xl" role="alert">
            <strong className="font-bold">Terjadi Kesalahan: </strong>
            <span className="block sm:inline">{error}</span>
            <button
                onClick={() => loadInitialQuestions()}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                Coba Lagi
            </button>
          </div>
        );
    }

    if (currentQuestion) {
      return (
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <QuestionCard 
              questionData={currentQuestion}
              onAnswer={handleAnswer}
              selectedAnswer={selectedAnswer}
              isAnswered={isAnswered}
            />
        </div>
      );
    }
    
    if(!apiKey){
        return (
             <div className="text-center p-8 bg-white rounded-lg shadow-md w-full max-w-2xl animate-fade-in">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">API Key Diperlukan</h2>
                <p className="text-gray-600 mb-4">Untuk memulai, silakan atur Google Gemini API Key Anda melalui ikon pengaturan di pojok kanan atas.</p>
                <button onClick={() => setIsApiKeyModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    Atur API Key
                </button>
            </div>
        )
    }

    return null;
  };
  
  if (appState === 'welcome') {
      return (
          <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                      Selamat Datang Calon Abdi Negara!
                  </h1>
                  <p className="text-lg text-gray-600 mb-8">
                      Asah kemampuan Anda dengan latihan soal CPNS tanpa batas yang dibuat oleh AI. Bersiaplah untuk meraih NIP impian Anda!
                  </p>
                  <button
                      onClick={handleStart}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
                  >
                      Mulai Latihan
                  </button>
              </div>
          </div>
      );
  }

  return (
    <>
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />
      <div className="min-h-screen w-screen flex flex-col items-center p-4 md:p-6">
        <header className="w-full max-w-4xl mx-auto mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-6">Latihan Soal CPNS Berbasis AI</h1>
          
          <div className="bg-white p-4 rounded-xl shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Pilih Kategori Soal:</label>
                      <div className="flex flex-wrap bg-gray-100 rounded-lg p-1">
                          {TOP_LEVEL_CATEGORIES.map(cat => (
                             <button 
                               key={cat}
                               onClick={() => handleCategoryChange(cat)}
                               className={`flex-grow sm:flex-grow-0 text-sm font-semibold px-3 py-2 rounded-md transition-colors duration-200 ${category === cat ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                             >
                              {cat}
                             </button>
                          ))}
                          <div className="relative" ref={skbDropdownRef}>
                              <button
                                  onClick={() => setIsSkbDropdownOpen(prev => !prev)}
                                  className={`flex-grow sm:flex-grow-0 text-sm font-semibold px-3 py-2 rounded-md transition-colors duration-200 w-full sm:w-auto flex items-center justify-center ${category?.startsWith('SKB') ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                              >
                                  {skbButtonText}
                                  <svg className={`inline-block ml-1 h-4 w-4 transition-transform ${isSkbDropdownOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                              </button>
                              {isSkbDropdownOpen && (
                                  <div className="absolute z-20 mt-2 w-64 bg-white rounded-lg shadow-xl max-h-72 overflow-y-auto right-0 sm:left-0 border border-gray-200">
                                      <div className="p-2 space-y-1">
                                          {SKB_FIELDS.map(field => (
                                              <button
                                                  key={field}
                                                  onClick={() => handleSkbCategoryChange(field)}
                                                  className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors duration-150 ${category === `SKB - ${field}` ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                              >
                                                  {field}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center sm:text-right">
                        <p className="text-lg font-semibold text-indigo-600">Skor Anda</p>
                        <p className="text-3xl font-bold text-gray-700">{score}<span className="text-xl font-medium text-gray-500"> / {questionsAnswered}</span> <span className="text-base font-bold text-gray-400">({scorePercentage}%)</span></p>
                    </div>
                     <button onClick={() => setIsApiKeyModalOpen(true)} title="Pengaturan API Key" className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                     </button>
                  </div>
              </div>
          </div>
        </header>

        <main className="w-full flex-1 flex flex-col items-center">
          {renderContent()}
        </main>
        
        {isAnswered && currentQuestion && (
          <footer className="w-full max-w-4xl mx-auto mt-6">
              <button
                  onClick={handleNextQuestion}
                  disabled={isFetchingNext}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-wait shadow-lg hover:shadow-indigo-500/50"
              >
                  {isFetchingNext ? <><LoadingSpinner /><span className="ml-3">Memuat Soal...</span></> : 'Soal Berikutnya'}
              </button>
          </footer>
        )}
      </div>
    </>
  );
};

export default App;
