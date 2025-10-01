import React, { useState } from 'react';
import { PivotTable } from '../types';
import PivotChart from './PivotChart';
import DataTable from './DataTable';
import { HIGH_CARDINALITY_CHARTS } from '../constants';
import { TableIcon, ChartIcon, DownloadIcon, CopyIcon, CheckIcon } from './icons';
import { convertToCSV } from '../services/downloadService';
import saveAs from 'file-saver';

interface PivotSectionProps {
    title: string;
    data: PivotTable;
}

const PivotSection: React.FC<PivotSectionProps> = ({ title, data }) => {
    const [view, setView] = useState<'table' | 'chart'>('table');
    const [copied, setCopied] = useState(false);

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

    const handleCopyToClipboard = () => {
        const tsvString = convertToCSV(data, '\t');
        navigator.clipboard.writeText(tsvString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadCsv} title="Download as CSV" className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleCopyToClipboard} title="Copy to Clipboard" className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors">
                        {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                    <div className="p-1 bg-slate-100 rounded-lg flex">
                         <button onClick={() => setView('table')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'table' ? 'bg-white shadow' : 'text-slate-600'}`}>
                            <TableIcon className="w-5 h-5 inline-block sm:mr-2" /> <span className="hidden sm:inline">Table</span>
                         </button>
                         <button onClick={() => setView('chart')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'chart' ? 'bg-white shadow' : 'text-slate-600'}`}>
                             <ChartIcon className="w-5 h-5 inline-block sm:mr-2" /> <span className="hidden sm:inline">Chart</span>
                         </button>
                    </div>
                </div>
            </div>
            
            {view === 'table' ? <DataTable data={data} /> : <PivotChart data={chartData} title={title} isHorizontal={isHighCardinality} />}
        </div>
    );
};

export default PivotSection;