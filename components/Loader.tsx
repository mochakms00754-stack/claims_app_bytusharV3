
import React from 'react';

interface LoaderProps {
    progress?: number | null;
}

const Loader: React.FC<LoaderProps> = ({ progress }) => {
    const isDeterminate = progress !== null && progress >= 0;

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            {isDeterminate ? (
                <div className="w-full max-w-md">
                    <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
                        <div 
                            className="bg-primary h-4 rounded-full transition-all duration-300 ease-linear" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-primary font-semibold">{Math.round(progress ?? 0)}%</p>
                </div>
            ) : (
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            )}
            <h2 className="mt-6 text-xl font-semibold text-slate-700">
                {isDeterminate ? "Loading your data..." : "Processing your data..."}
            </h2>
            <p className="mt-2 text-slate-500">
                Please wait, this might take a moment for large files. The app will be ready once loading is complete.
            </p>
        </div>
    );
};

export default Loader;
