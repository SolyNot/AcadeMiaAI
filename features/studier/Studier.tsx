
import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Loader from '../../components/ui/Loader';
import { generateFlashcardsFromText, generateQuizFromText } from '../../services/geminiService';
import { Flashcard, QuizQuestion } from '../../types';

type StudierMode = 'flashcards' | 'quiz' | 'exam';

const Studier: React.FC = () => {
    const [mode, setMode] = useState<StudierMode>('flashcards');
    const [notes, setNotes] = useState('');
    const [examTopic, setExamTopic] = useState('');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (mode === 'exam' && quiz.length > 0 && !showResults) {
            const examTime = quiz.length * 60; // 1 minute per question
            setTimer(examTime);
            timerRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setShowResults(true); // Auto-submit when time is up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [mode, quiz, showResults]);

    const handleGenerate = async () => {
        if ((mode !== 'exam' && !notes) || (mode === 'exam' && !examTopic)) return;
        setIsLoading(true);
        setError('');
        setFlashcards([]);
        setQuiz([]);
        setUserAnswers({});
        setShowResults(false);

        try {
            if (mode === 'flashcards') {
                const generatedCards = await generateFlashcardsFromText(notes);
                setFlashcards(generatedCards);
            } else if (mode === 'quiz') {
                const generatedQuiz = await generateQuizFromText(notes, 5);
                setQuiz(generatedQuiz);
            } else { // exam
                const generatedExam = await generateQuizFromText(`Generate an exam on the topic: ${examTopic}`, 10);
                setQuiz(generatedExam);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateScore = () => {
        let score = 0;
        quiz.forEach((q, index) => {
            if (userAnswers[index] === q.correctAnswer) {
                score++;
            }
        });
        return score;
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">Study Tools</h1>

            <Card>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button variant={mode === 'flashcards' ? 'primary' : 'secondary'} onClick={() => setMode('flashcards')}>Flashcards</Button>
                    <Button variant={mode === 'quiz' ? 'primary' : 'secondary'} onClick={() => setMode('quiz')}>Quiz</Button>
                    <Button variant={mode === 'exam' ? 'primary' : 'secondary'} onClick={() => setMode('exam')}>Exam Simulator</Button>
                </div>
                {mode === 'exam' ? (
                    <input
                        type="text"
                        value={examTopic}
                        onChange={(e) => setExamTopic(e.target.value)}
                        placeholder="Enter exam topic, e.g., 'The Cold War'"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
                    />
                ) : (
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Paste your lecture notes or text to summarize..."
                        rows={8}
                    />
                )}
                <div className="flex justify-end mt-4">
                    <Button onClick={handleGenerate} isLoading={isLoading}>Generate {mode}</Button>
                </div>
            </Card>

            {isLoading && <Card><Loader text={`Generating ${mode}...`} /></Card>}
            {error && <Card><p className="text-red-500">{error}</p></Card>}

            {flashcards.length > 0 && mode === 'flashcards' && (
                <Card>
                    <div
                        className="w-full h-56 sm:h-64 flex items-center justify-center p-6 rounded-lg cursor-pointer transition-transform duration-500"
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className="absolute w-full h-full bg-indigo-200 dark:bg-indigo-800 rounded-lg flex items-center justify-center p-4 text-center" style={{ backfaceVisibility: 'hidden' }}>
                            <p className="text-xl sm:text-2xl font-semibold">{flashcards[currentCard].term}</p>
                        </div>
                        <div className="absolute w-full h-full bg-indigo-300 dark:bg-indigo-700 rounded-lg flex items-center justify-center p-4 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <p className="text-lg sm:text-xl">{flashcards[currentCard].definition}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <Button onClick={() => { setCurrentCard(s => Math.max(0, s - 1)); setIsFlipped(false); }} disabled={currentCard === 0}>Previous</Button>
                        <span>Card {currentCard + 1} of {flashcards.length}</span>
                        <Button onClick={() => { setCurrentCard(s => Math.min(flashcards.length - 1, s + 1)); setIsFlipped(false); }} disabled={currentCard === flashcards.length - 1}>Next</Button>
                    </div>
                </Card>
            )}

            {quiz.length > 0 && (mode === 'quiz' || mode === 'exam') && (
                <Card>
                    {showResults ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{mode === 'exam' ? 'Exam' : 'Quiz'} Results</h2>
                            <p className="text-xl mb-4">You scored {calculateScore()} out of {quiz.length}</p>
                            <Button onClick={() => { setShowResults(false); setUserAnswers({}); setQuiz([]); }}>
                                {mode === 'exam' ? 'Take New Exam' : 'Try Again'}
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">{mode === 'exam' ? 'Exam Mode' : 'Quiz'}</h2>
                                {mode === 'exam' && <div className="text-xl font-mono bg-red-500 text-white px-3 py-1 rounded-md">{formatTime(timer)}</div>}
                            </div>
                            {quiz.map((q, index) => (
                                <div key={index} className="mb-6">
                                    <p className="font-semibold text-lg mb-2">{index + 1}. {q.question}</p>
                                    <div className="space-y-2">
                                        {q.options.map((option, i) => (
                                            <label key={i} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                                <input type="radio" name={`question-${index}`} value={option} onChange={(e) => setUserAnswers({ ...userAnswers, [index]: e.target.value })} className="mr-2 h-4 w-4" />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end">
                                <Button onClick={() => setShowResults(true)}>Submit {mode === 'exam' ? 'Exam' : 'Quiz'}</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Studier;
