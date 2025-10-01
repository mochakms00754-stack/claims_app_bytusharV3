import React, { useState } from 'react';
import { ProcessedData, PivotDict, ClaimRecord } from '../types';
import { generateEnrichedExcel, generatePivotsExcel, generatePartnerZips, generatePivotsCsvZip } from '../services/downloadService';
import { DownloadIcon, PdfIcon, TrendingUpIcon } from './icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface DownloadButtonsV2Props {
    processedData: ProcessedData;
    filteredData: ClaimRecord[];
    pivotDict: PivotDict | null;
    onAdvancedAnalysisClick: () => void;
}

const DownloadButtonsV2: React.FC<DownloadButtonsV2Props> = ({ processedData, pivotDict, filteredData, onAdvancedAnalysisClick }) => {
    const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});

    const handleDownload = async (type: 'enriched' | 'pivots' | 'partners' | 'pivots-csv' | 'pdf') => {
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
                    await generatePartnerZips(filteredData);
                    break;
                case 'pivots-csv':
                    if (pivotDict) {
                        await generatePivotsCsvZip(pivotDict);
                    }
                    break;
                case 'pdf':
                    await generateChartsPdf();
                    break;
            }
        } catch (error) {
            console.error(`Failed to download ${type}`, error);
            alert(`An error occurred while generating the ${type} file.`);
        } finally {
            setIsDownloading(prev => ({ ...prev, [type]: false }));
        }
    };

    const generateChartsPdf = async () => {
        const chartElements = document.querySelectorAll('.chart-container-for-pdf');
        if (chartElements.length === 0) {
            alert('No charts available to download.');
            return;
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const imgWidth = pdfWidth - margin * 2;
        
        for (let i = 0; i < chartElements.length; i++) {
            const chartElement = chartElements[i] as HTMLElement;
            // Temporarily set a fixed width for consistent rendering
            const originalWidth = chartElement.style.width;
            chartElement.style.width = `1000px`;

            const canvas = await html2canvas(chartElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                onclone: (doc) => {
                  const body = doc.querySelector('body');
                  if (body) {
                    const cardBg = getComputedStyle(chartElement).backgroundColor;
                    body.style.background = cardBg;
                  }
                }
            });
            chartElement.style.width = originalWidth;

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (i > 0) {
                pdf.addPage();
            }
            
            const title = chartElement.closest('.pivot-section-v2')?.querySelector('h3')?.innerText || 'Chart';
            pdf.setFontSize(14);
            pdf.text(title, margin, margin + 5);
            pdf.addImage(imgData, 'PNG', margin, margin + 15, imgWidth, imgHeight, undefined, 'FAST');
        }

        pdf.save('charts_report.pdf');
    };
    
    const Button = ({ onClick, label, icon, disabled, isProcessing }: { onClick: () => void; label: string; icon: React.ReactNode; disabled?: boolean, isProcessing?: boolean }) => (
         <button
            onClick={onClick}
            disabled={isProcessing || disabled}
            className="flex items-center justify-center gap-2 bg-card text-primary font-semibold py-2 px-4 rounded-lg border-2 border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
            {icon}
            {isProcessing ? `Generating...` : label}
        </button>
    );

    return (
        <div className="bg-card p-4 rounded-xl shadow-md border border-border">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h3 className="text-md font-bold text-card-foreground mb-3 sm:mb-0">Actions & Reports</h3>
                <Button onClick={onAdvancedAnalysisClick} label="Advanced Analysis" icon={<TrendingUpIcon className="w-5 h-5"/>} disabled={!pivotDict || Object.keys(pivotDict).length === 0} />
             </div>
             <hr className="my-4 border-border"/>
             <div className="flex flex-wrap gap-4">
                <Button onClick={() => handleDownload('enriched')} label="Enriched Data (XLSX)" icon={<DownloadIcon className="w-5 h-5"/>} isProcessing={isDownloading['enriched']} />
                <Button onClick={() => handleDownload('pivots')} label="Filtered Pivots (XLSX)" icon={<DownloadIcon className="w-5 h-5"/>} isProcessing={isDownloading['pivots']} disabled={!pivotDict} />
                <Button onClick={() => handleDownload('partners')} label="Partner Pivots (ZIP)" icon={<DownloadIcon className="w-5 h-5"/>} isProcessing={isDownloading['partners']} />
                <Button onClick={() => handleDownload('pivots-csv')} label="Filtered Pivots (CSV-ZIP)" icon={<DownloadIcon className="w-5 h-5"/>} isProcessing={isDownloading['pivots-csv']} disabled={!pivotDict} />
                <Button onClick={() => handleDownload('pdf')} label="Charts (PDF)" icon={<PdfIcon className="w-5 h-5"/>} isProcessing={isDownloading['pdf']} disabled={!pivotDict} />
            </div>
        </div>
    );
};

export default DownloadButtonsV2;