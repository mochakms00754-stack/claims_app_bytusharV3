import React from 'react';
import { ProcessedData, PivotDict, KPIData } from '../types';
import KPICard from './KPICard';
import DownloadButtons from './DownloadButtons';
import PivotSection from './PivotSection';
import { ResetIcon } from './icons';

interface DashboardProps {
    processedData: ProcessedData;
    pivotDict: PivotDict | null;
    kpis: KPIData | null;
    onReset: () => void;
    fileName: string;
}

const Dashboard: React.FC<DashboardProps> = ({
    processedData,
    pivotDict,
    kpis,
    onReset,
    fileName,
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Analysis Results</h2>
                    <p className="text-slate-500 mt-1">
                        Displaying insights for <span className="font-semibold text-primary">{fileName}</span>
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                >
                    <ResetIcon className="w-5 h-5"/>
                    Start Over
                </button>
            </div>
            
            {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                    <KPICard title="Total Registered Claims" value={kpis.totalRows} rawValue={kpis.totalRowsRaw} />
                    <KPICard title="Total Claim Amount" value={kpis.sumClaim} rawValue={kpis.sumClaimRaw} />
                    <KPICard title="Total Settled Amount" value={kpis.sumSettled} rawValue={kpis.sumSettledRaw} />
                    <KPICard title="Average TAT (Days)" value={kpis.avgTat} rawValue={kpis.avgTatRaw} />
                </div>
            )}
            
            <div className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                <DownloadButtons processedData={processedData} pivotDict={pivotDict} />
            </div>

            <div className="space-y-6 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                {pivotDict && Object.keys(pivotDict).length > 0 ? (
                    Object.entries(pivotDict).map(([title, data]) => (
                        <PivotSection key={title} title={title} data={data} />
                    ))
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 text-center">
                        <h3 className="text-lg font-semibold text-slate-700">No Pivot Data Available</h3>
                        <p className="text-slate-500 mt-2">There were no claims found in the 'Registered with M-Swasth' category to generate pivot tables.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;