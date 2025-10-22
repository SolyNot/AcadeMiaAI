
import React from 'react';

interface LoaderProps {
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Generating..." }) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white/50 dark:bg-gray-900/50 rounded-lg">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{text}</p>
        </div>
    );
};

export default Loader;
