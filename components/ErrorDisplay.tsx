
import React from 'react';
import { ResetIcon } from './icons';

interface ErrorDisplayProps {
    message: string;
    onReset: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onReset }) => {
    return (
        <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md" role="alert">
            <h3 className="font-bold text-lg mb-2">Processing Failed</h3>
            <p className="mb-4">{message}</p>
            <button
                onClick={onReset}
                className="flex items-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors"
            >
                <ResetIcon className="w-5 h-5"/>
                Try Again
            </button>
        </div>
    );
};
