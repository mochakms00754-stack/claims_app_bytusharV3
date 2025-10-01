import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProcessedData, PivotDict, KPIData, ClaimRecord } from './types';
import { processClaimsFile, generatePivots } from './services/fileProcessor';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import DashboardV2 from './components/DashboardV2';
import Loader from './components/Loader';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import AdvancedAnalysisModal from './components/AdvancedAnalysisModal';
// Fix: Changed date-fns `parse` import to use submodule `date-fns/parse` to resolve module export error.
import { isAfter, isBefore, endOfDay, isValid } from 'date-fns';
import parse from 'date-fns/parse';


export interface V2Filters {
    dateFrom: string;
    dateTo: string;
    Region: string[];
    State: string[];
    'Filed By': string[];
    Product: string[];
    'Aging Days Bucketing': string[];
    Channel: string[];
}

// Worker code is inlined here to prevent CORS errors when loading from an external file.
const workerCode = `
    console.log('Worker script started.');
    // Using a direct, absolute URL to a known reliable CDN for the specific script file.
    // The previous URL was ambiguous and failed in the worker's sandboxed environment.
    const PAPA_URL = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
    try {
        self.importScripts(PAPA_URL);

        // Assign the onmessage handler only after the script has successfully loaded.
        self.onmessage = (e) => {
            console.log('Worker: Received message from main thread.', e.data);
            const { file } = e.data;

            if (!self.Papa) {
                console.error('Worker: Papaparse library not available.');
                self.postMessage({ type: 'error', message: 'Papaparse library not available.' });
                return;
            }

            if (!file) {
                console.error('Worker: No file object received.');
                self.postMessage({ type: 'error', message: 'No file received by worker.' });
                return;
            }

            const fileSize = file.size;
            console.log('Worker: Starting to parse file:', file.name, 'Size:', fileSize);

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                worker: false, // Already in a worker
                chunk: (results, parser) => {
                    const processedBytes = results.meta.cursor;
                    const progress = Math.min(99, (processedBytes / fileSize) * 100);
                    
                    self.postMessage({ 
                        type: 'chunk', 
                        payload: results.data 
                    });
                    self.postMessage({
                        type: 'progress',
                        value: progress,
                    });
                },
                complete: () => {
                    console.log('Worker: File parsing complete.');
                    self.postMessage({ type: 'progress', value: 100 });
                    self.postMessage({ type: 'finish' });
                },
                error: (error) => {
                    console.error('Worker: CSV parsing error:', error);
                    self.postMessage({ type: 'error', message: \`CSV parsing error: \${error.message}\` });
                },
            });
        };
    } catch (e) {
        console.error("Worker: Failed to load Papaparse script from " + PAPA_URL, e);
        self.postMessage({ type: 'error', message: 'Could not load data parsing library.' });
        // Removed the illegal 'return' statement from the global scope.
    }
`;


const App: React.FC = () => {
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [pivotDict, setPivotDict] = useState<PivotDict | null>(null);
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [view, setView] = useState<'v1' | 'v2'>('v1');
    const [theme, setTheme] = useState<string>('light');
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);

    // V2 State
    const [filters, setFilters] = useState<V2Filters | null>(null);
    const [filteredRegisteredData, setFilteredRegisteredData] = useState<ClaimRecord[]>([]);
    const [pivotDictV2, setPivotDictV2] = useState<PivotDict | null>(null);
    const [kpisV2, setKpisV2] = useState<KPIData | null>(null);
    const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

    const handleFileProcess = useCallback((file: File) => {
        setIsLoading(true);
        setError(null);
        setProcessedData(null);
        setPivotDict(null);
        setKpis(null);
        setFileName(file.name);
        setView('v1');
        setTheme('light');
        setProgress(0);
        console.log('Starting file processing for:', file.name);
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        console.log('Worker created from Blob URL:', workerUrl);

        const allData: ClaimRecord[] = [];

        const cleanup = () => {
            console.log("Cleaning up worker and revoking Blob URL.");
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        worker.onmessage = (e: MessageEvent) => {
            const { type, payload, value, message } = e.data;
             console.log('Main thread received message:', { type, value, message, payload_size: payload?.length ?? 0 });
            
            switch (type) {
                case 'chunk':
                    allData.push(...payload);
                    break;
                case 'progress':
                    setProgress(value);
                    break;
                case 'finish':
                    try {
                        console.log('Post-processing started on main thread.');
                        if (allData.length === 0) {
                            throw new Error("CSV file is empty or could not be parsed.");
                        }
                        
                        const pData = processClaimsFile(allData);
                        
                        // V1 Data Processing
                        if (pData.df_registered.length > 0) {
                            const { pivotDict: pivots, kpis: calculatedKpis } = generatePivots(pData.df_registered);
                            setPivotDict(pivots);
                            setKpis(calculatedKpis);
                        } else {
                            setPivotDict({});
                            setKpis({
                                totalRows: '0', sumClaim: '₹0', sumSettled: '₹0', avgTat: '0.0',
                                totalRowsRaw: 0, sumClaimRaw: 0, sumSettledRaw: 0, avgTatRaw: 0,
                            });
                        }

                        // V2 Initial Setup
                        const getUniqueOptions = (key: string) => [...new Set(pData.df_registered.map(row => row[key]).filter(Boolean))].sort() as string[];
                        const newFilterOptions = {
                            Region: getUniqueOptions('Region'),
                            State: getUniqueOptions('State'),
                            'Filed By': getUniqueOptions('Filed By'),
                            Product: getUniqueOptions('Product'),
                            Channel: getUniqueOptions('Channel'),
                            'Aging Days Bucketing': getUniqueOptions('Aging Days Bucketing'),
                        };
                        setFilterOptions(newFilterOptions);
                        
                        const initialFilters: V2Filters = {
                            dateFrom: '', dateTo: '',
                            Region: [], State: [], 'Filed By': [], Product: [], Channel: [], 'Aging Days Bucketing': [],
                        };
                        setFilters(initialFilters);
                        
                        setProcessedData(pData);
                        console.log('Post-processing finished successfully.');
                    } catch (err) {
                        console.error("Error during post-processing:", err);
                        setError(err instanceof Error ? err.message : 'An unknown error occurred during post-processing.');
                    } finally {
                        setIsLoading(false);
                        setProgress(null);
                        cleanup();
                    }
                    break;
                case 'error':
                    console.error("Received error message from worker:", message);
                    setError(message);
                    setIsLoading(false);
                    setProgress(null);
                    cleanup();
                    break;
            }
        };

        worker.onerror = (err) => {
            console.error("Worker error:", err);
            setError(`An unexpected worker error occurred: ${err.message}`);
            setIsLoading(false);
            setProgress(null);
            cleanup();
        };

        console.log("Posting file to worker...");
        worker.postMessage({ file });
    }, []);
    
    // V2: Effect to filter data and generate new pivots when filters change
    useEffect(() => {
        if (!processedData || !filters) return;

        const filtered = processedData.df_registered.filter(row => {
            const claimDate = row.parsedClaimIntimationDate as Date | null;
            if (claimDate && isValid(claimDate)) {
                if (filters.dateFrom && isBefore(claimDate, parse(filters.dateFrom, 'yyyy-MM-dd', new Date()))) return false;
                if (filters.dateTo && isAfter(claimDate, endOfDay(parse(filters.dateTo, 'yyyy-MM-dd', new Date())))) return false;
            } else if (filters.dateFrom || filters.dateTo) {
                return false;
            }

            for (const key of Object.keys(filterOptions)) {
                const filterValues = filters[key as keyof V2Filters] as string[];
                if (filterValues.length > 0 && !filterValues.includes(String(row[key]))) {
                    return false;
                }
            }
            return true;
        });

        setFilteredRegisteredData(filtered);
        
        const { pivotDict: pivotsV2, kpis: kpisV2 } = generatePivots(filtered);
        setPivotDictV2(pivotsV2);
        setKpisV2(kpisV2);

    }, [processedData, filters, filterOptions]);


    const handleReset = () => {
        setProcessedData(null);
        setPivotDict(null);
        setKpis(null);
        setError(null);
        setIsLoading(false);
        setFileName('');
        setView('v1');
        setTheme('light');
        setFilters(null);
        setFilterOptions({});
        setPivotDictV2(null);
        setKpisV2(null);
        setProgress(null);
    };

    return (
        <div data-theme={view === 'v2' ? theme : 'light'}>
            <div className="min-h-screen bg-background">
                <Header view={view} setView={setView} isFileLoaded={!!processedData} theme={theme} setTheme={setTheme} />
                <main className="container mx-auto p-4 md:p-8">
                    {isLoading ? (
                        <Loader progress={progress} />
                    ) : error ? (
                        <ErrorDisplay message={error} onReset={handleReset} />
                    ) : !processedData ? (
                        <FileUpload onFileProcess={handleFileProcess} />
                    ) : view === 'v1' ? (
                         <Dashboard
                            processedData={processedData}
                            pivotDict={pivotDict}
                            kpis={kpis}
                            onReset={handleReset}
                            fileName={fileName}
                        />
                    ) : (
                        <DashboardV2
                            processedData={processedData}
                            filteredData={filteredRegisteredData}
                            pivotDict={pivotDictV2}
                            kpis={kpisV2}
                            onReset={handleReset}
                            fileName={fileName}
                            filters={filters}
                            setFilters={setFilters}
                            filterOptions={filterOptions}
                            onAdvancedAnalysisClick={() => setAnalysisModalOpen(true)}
                        />
                    )}
                </main>
                {isAnalysisModalOpen && (
                    <AdvancedAnalysisModal
                        isOpen={isAnalysisModalOpen}
                        onClose={() => setAnalysisModalOpen(false)}
                        data={filteredRegisteredData}
                    />
                )}
            </div>
        </div>
    );
};

export default App;