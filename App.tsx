
import React, { useState } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import Writer from './features/writer/Writer';
import Presenter from './features/presenter/Presenter';
import Visualizer from './features/visualizer/Visualizer';
import Analyzer from './features/analyzer/Analyzer';
import Speaker from './features/speaker/Speaker';
import Studier from './features/studier/Studier';
import Planner from './features/planner/Planner';
import ChatBot from './features/chat/ChatBot';
import { IconMenu } from './constants';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard />;
            case 'writer':
                return <Writer />;
            case 'presenter':
                return <Presenter />;
            case 'visualizer':
                return <Visualizer />;
            case 'analyzer':
                return <Analyzer />;
            case 'speaker':
                return <Speaker />;
            case 'studier':
                return <Studier />;
            case 'planner':
                return <Planner />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 bg-white/50 dark:bg-gray-800/50 p-2 rounded-full backdrop-blur-sm"
                aria-label="Open sidebar"
            >
                <IconMenu />
            </button>

            <Sidebar currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 transition-all duration-300 md:ml-64">
                {renderView()}
            </main>
            <ChatBot />
        </div>
    );
};

export default App;
