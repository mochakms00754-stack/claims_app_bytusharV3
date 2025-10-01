
import React, { useState } from 'react';
import { ProcessedData, PivotDict } from '../types';
import { generateEnrichedExcel, generatePivotsExcel, generatePartnerZips, generatePivotsCsvZip } from '../services/downloadService';
import { DownloadIcon } from './icons';

interface DownloadButtonsProps {
    processedData: ProcessedData;
    pivotDict: PivotDict | null;
}

const DownloadButtons: React.FC<DownloadButtonsProps> = ({ processedData, pivotDict }) => {
    const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});

    const handleDownload = async (type: 'enriched' | 'pivots' | 'partners' | 'pivots-csv') => {
        setIsDownloading(prev => ({ ...prev, [type]: true }));
        try {
            switch (type) {
                case 'enriched':
                    await generateEnrichedExcel(processedData);
                    break;
                case 'pivots':
                    if (pivotDict) {
                        await generatePivotsExcel(pivotDict);
                    }
                    break;
                case 'partners':
                    await generatePartnerZips(processedData.df_registered);
                    break;
                case 'pivots-csv':
                    if (pivotDict) {
                        await generatePivotsCsvZip(pivotDict);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Failed to download ${type}`, error);
            alert(`An error occurred while generating the ${type} file.`);
        } finally {
            setIsDownloading(prev => ({ ...prev, [type]: false }));
        }
    };
    
    const Button = ({ type, label, disabled }: { type: 'enriched' | 'pivots' | 'partners' | 'pivots-csv'; label: string; disabled?: boolean }) => (
         <button
            onClick={() => handleDownload(type)}
            disabled={isDownloading[type] || disabled}
            className="flex items-center justify-center gap-2 bg-white text-primary font-semibold py-2 px-4 rounded-lg border-2 border-primary hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
            <DownloadIcon className="w-5 h-5"/>
            {isDownloading[type] ? `Generating...` : label}
        </button>
    );

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
             <h3 className="text-md font-bold text-slate-700 mb-3">Download Reports</h3>
             <div className="flex flex-wrap gap-4">
                <Button type="enriched" label="Enriched Data (XLSX)" />
                <Button type="pivots" label="All Pivots (XLSX)" disabled={!pivotDict} />
                <Button type="partners" label="Partner Pivots (ZIP)" />
                <Button type="pivots-csv" label="All Pivots (CSV-ZIP)" disabled={!pivotDict} />
            </div>
        </div>
    );
};

export default DownloadButtons;