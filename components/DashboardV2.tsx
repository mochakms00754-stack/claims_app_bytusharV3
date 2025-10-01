import React from 'react';
import { ProcessedData, PivotDict, KPIData, ClaimRecord } from '../types';
import { V2Filters } from '../App';
import KPICard from './KPICard';
import DownloadButtonsV2 from './DownloadButtonsV2';
import PivotSectionV2 from './PivotSectionV2';
import GlobalFilters from './GlobalFilters';
import { ResetIcon } from './icons';

interface DashboardV2Props {
    processedData: ProcessedData;
    filteredData: ClaimRecord[];
    pivotDict: PivotDict | null;
    kpis: KPIData | null;
    onReset: () => void;
    fileName: string;
    filters: V2Filters | null;
    setFilters: React.Dispatch<React.SetStateAction<V2Filters | null>>;
    filterOptions: Record<string, string[]>;
    onAdvancedAnalysisClick: () => void;
}

const DashboardV2: React.FC<DashboardV2Props> = ({
    processedData,
    filteredData,
    pivotDict,
    kpis,
    onReset,
    fileName,
    filters,
    setFilters,
    filterOptions,
    onAdvancedAnalysisClick
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Analysis Results (V2)</h2>
                    <p className="text-muted-foreground mt-1">
                        Displaying insights for <span className="font-semibold text-primary">{fileName}</span>
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 bg-card text-foreground font-semibold py-2 px-4 rounded-lg border border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                >
                    <ResetIcon className="w-5 h-5"/>
                    Start Over
                </button>
            </div>
            
            {filters && <GlobalFilters filters={filters} setFilters={setFilters} options={filterOptions} />}
            
            {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                    <KPICard title="Total Registered Claims" value={kpis.totalRows} rawValue={kpis.totalRowsRaw} />
                    <KPICard title="Total Claim Amount" value={kpis.sumClaim} rawValue={kpis.sumClaimRaw} />
                    <KPICard title="Total Settled Amount" value={kpis.sumSettled} rawValue={kpis.sumSettledRaw} />
                    <KPICard title="Average TAT (Days)" value={kpis.avgTat} rawValue={kpis.avgTatRaw} />
                </div>
            )}
            
            <div className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                <DownloadButtonsV2
                    processedData={processedData}
                    pivotDict={pivotDict}
                    filteredData={filteredData}
                    onAdvancedAnalysisClick={onAdvancedAnalysisClick}
                />
            </div>

            <div className="space-y-6 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                {pivotDict && Object.keys(pivotDict).length > 0 ? (
                    Object.entries(pivotDict).map(([title, data]) => (
                        <PivotSectionV2 key={title} title={title} data={data} />
                    ))
                ) : (
                    <div className="bg-card p-6 rounded-xl shadow-md border border-border text-center">
                        <h3 className="text-lg font-semibold text-card-foreground">No Pivot Data Available</h3>
                        <p className="text-muted-foreground mt-2">There were no claims found for the selected filters. Try adjusting your filter criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardV2;