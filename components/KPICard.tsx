import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface KPICardProps {
    title: string;
    value: string | number;
    rawValue: number;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, rawValue }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(rawValue));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="group relative bg-card p-5 rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer"
            onClick={handleCopy}
            title="Click to copy value"
        >
            <div className="absolute top-4 right-4">
                {copied ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                ) : (
                    <CopyIcon className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors duration-300" />
                )}
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pr-8">{title}</h3>
            <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
            {copied && <div className="absolute bottom-2 right-2 text-xs text-green-600 font-semibold">Copied!</div>}
        </div>
    );
};

export default KPICard;