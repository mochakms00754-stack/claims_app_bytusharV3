import React, { useState, useRef } from 'react';
import { PivotTable } from '../types';
import PivotChartV2 from './PivotChartV2';
import DataTable from './DataTable';
import { HIGH_CARDINALITY_CHARTS } from '../constants';
import { TableIcon, ChartIcon, DownloadIcon, CopyIcon, CheckIcon } from './icons';
import { convertToCSV } from '../services/downloadService';
import saveAs from 'file-saver';
import html2canvas from 'html2canvas';

interface PivotSectionProps {
    title: string;
    data: PivotTable;
}

const PivotSectionV2: React.FC<PivotSectionProps> = ({ title, data }) => {
    const [view, setView] = useState<'table' | 'chart'>('table');
    const [copied, setCopied] = useState(false);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const isHighCardinality = HIGH_CARDINALITY_CHARTS.has(title);
    let chartData = data.filter(row => row[Object.keys(row)[0]] !== 'TOTAL');

    if (isHighCardinality && chartData.length > 15) {
        const top15 = chartData.slice(0, 15);
        const others = chartData.slice(15);
        const otherRow = {
            [title]: 'Other',
            'Rows': others.reduce((acc, row) => acc + row['Rows'], 0),
            'Claim_Amount': others.reduce((acc, row) => acc + row['Claim_Amount'], 0),
            'Settled_Amount': others.reduce((acc, row) => acc + row['Settled_Amount'], 0),
        };
        chartData = [...top15, otherRow];
    }
    
    const handleDownloadCsv = () => {
        const csvString = convertToCSV(data);
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const safeName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        saveAs(blob, `${safeName}_pivot.csv`);
    };

    const handleCopyToClipboard = async () => {
        setCopied(false);
        if (view === 'chart') {
            if (chartContainerRef.current) {
                try {
                    const canvas = await html2canvas(chartContainerRef.current, { scale: 2, backgroundColor: 'rgb(var(--color-card-background))' });
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            await navigator.clipboard.write([
                                new ClipboardItem({ 'image/png': blob })
                            ]);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }
                    }, 'image/png');
                } catch (e) {
                    console.error("Failed to copy image: ", e);
                    alert("Could not copy image to clipboard.");
                }
            }
        } else {
            const tsvString = convertToCSV(data, '\t');
            navigator.clipboard.writeText(tsvString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-border pivot-section-v2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadCsv} title="Download as CSV" className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleCopyToClipboard} title={view === 'chart' ? "Copy Chart Image" : "Copy Table Data"} className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                        {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                    <div className="p-1 bg-muted rounded-lg flex">
                         <button onClick={() => setView('table')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'table' ? 'bg-card shadow' : 'text-muted-foreground'}`}>
                            <TableIcon className="w-5 h-5 inline-block sm:mr-2" /> <span className="hidden sm:inline">Table</span>
                         </button>
                         <button onClick={() => setView('chart')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'chart' ? 'bg-card shadow' : 'text-muted-foreground'}`}>
                             <ChartIcon className="w-5 h-5 inline-block sm:mr-2" /> <span className="hidden sm:inline">Chart</span>
                         </button>
                    </div>
                </div>
            </div>
            
            {view === 'table' ? <DataTable data={data} /> : <PivotChartV2 ref={chartContainerRef} data={chartData} title={title} isHorizontal={isHighCardinality} />}
        </div>
    );
};

export default PivotSectionV2;