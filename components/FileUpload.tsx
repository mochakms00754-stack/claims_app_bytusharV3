
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
    onFileProcess: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleSubmit = () => {
        if (file) {
            onFileProcess(file);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-card p-8 rounded-2xl shadow-lg border border-border text-center">
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Upload Your Claims Data</h2>
            <p className="text-muted-foreground mb-6">Drag & drop or select a CSV file to begin analysis.</p>

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-lg p-10 transition-colors duration-200 ${
                    isDragging ? 'border-primary bg-primary/10' : 'border-border bg-background'
                }`}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".csv"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <UploadIcon className="w-12 h-12 text-muted-foreground" />
                    <p className="text-foreground">
                        <label htmlFor="file-upload" className="font-semibold text-primary cursor-pointer hover:underline">
                            Click to upload
                        </label> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground/80">Only CSV files are supported</p>
                </div>
            </div>

            {file && (
                <div className="mt-6 text-left p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-card-foreground">Selected file:</p>
                    <p className="text-sm text-muted-foreground truncate">{file.name}</p>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!file}
                className="mt-8 w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300"
            >
                Process File
            </button>
        </div>
    );
};

export default FileUpload;