
import React from 'react';
import { View, NavItem } from '../types';
import { IconDashboard, IconWriter, IconPresenter, IconVisualizer, IconAnalyzer, IconSpeaker, IconStudier, IconPlanner, IconSparkles } from '../constants';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'writer', label: 'Writer', icon: <IconWriter /> },
    { id: 'presenter', label: 'Presenter', icon: <IconPresenter /> },
    { id: 'visualizer', label: 'Visualizer', icon: <IconVisualizer /> },
    { id: 'analyzer', label: 'Analyzer', icon: <IconAnalyzer /> },
    { id: 'speaker', label: 'Speaker', icon: <IconSpeaker /> },
    { id: 'studier', label: 'Studier', icon: <IconStudier /> },
    { id: 'planner', label: 'Planner', icon: <IconPlanner /> },
];


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen }) => {
    
    const handleNavClick = (view: View) => {
        setCurrentView(view);
        // Close sidebar on navigation in mobile view
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <>
            <aside className={`w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col shadow-2xl fixed h-full z-40 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <IconSparkles />
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 ml-2">Academia AI</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center px-4 py-3 text-lg rounded-lg transition-all duration-200 ${
                                currentView === item.id
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            <span className="ml-4">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}
        </>
    );
};

export default Sidebar;
