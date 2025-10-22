
import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { analyzeProgress } from '../../services/geminiService';
import Loader from '../../components/ui/Loader';

const Dashboard: React.FC = () => {
    const [progressReport, setProgressReport] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            setIsLoading(true);
            try {
                // Mock data for demonstration purposes
                const mockProgressData = {
                    tasksCompleted: 8,
                    tasksTotal: 12,
                    topicsStudied: ['Calculus', 'American Revolution', 'Organic Chemistry'],
                };
                const report = await analyzeProgress(mockProgressData);
                setProgressReport(report);
            } catch (error) {
                setProgressReport("Could not load progress report. Please try again later.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProgress();
    }, []);


    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">Welcome to Academia AI</h1>
                <p className="text-md sm:text-lg text-gray-600 dark:text-gray-400 mt-2">Your all-in-one assistant for academic excellence.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="transform hover:scale-105 transition-transform md:col-span-2 lg:col-span-1">
                    <h2 className="text-2xl font-semibold mb-2 text-indigo-500">AI Progress Review</h2>
                    {isLoading ? <Loader text="Analyzing..." /> : <p className="text-gray-600 dark:text-gray-400">{progressReport}</p>}
                </Card>

                <Card className="transform hover:scale-105 transition-transform">
                    <h2 className="text-2xl font-semibold mb-2 text-green-500">Upcoming Tasks</h2>
                    <p className="text-gray-600 dark:text-gray-400">Stay on top of your deadlines.</p>
                    <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>- Math Homework (Due Tomorrow)</li>
                        <li>- History Essay (Due Friday)</li>
                        <li>- Lab Report (Due next Monday)</li>
                    </ul>
                </Card>
                
                <Card className="transform hover:scale-105 transition-transform">
                    <h2 className="text-2xl font-semibold mb-2 text-yellow-500">Collaboration</h2>
                    <p className="text-gray-600 dark:text-gray-400">Work with your team in real-time.</p>
                    <div className="mt-4 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Collaboration feature coming soon.</p>
                    </div>
                </Card>
            </div>
             <Card>
                <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Use the sidebar to navigate between features. Whether you need to write an essay, create a presentation, or study for a test, Academia AI has you covered. The AI Chatbot is always available at the bottom right for instant help.
                </p>
            </Card>
        </div>
    );
};

export default Dashboard;
