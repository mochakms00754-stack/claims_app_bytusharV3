
import { ClaimRecord, ProcessedData, PivotDict, KPIData, PivotTable } from '../types';
import { MAP_A, MAP_B, MAP_C, PIVOT_CATEGORIES, STATUS_MAP_REGISTERED } from '../constants';
// Fix: Changed date-fns `parse` import to use submodule `date-fns/parse` to resolve module export error.
import { differenceInDays, isValid } from 'date-fns';
import parse from 'date-fns/parse';

const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined || String(value).trim() === '') return NaN;
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? NaN : num;
};

const robustDateParse = (dateInput: any): Date | null => {
    if (!dateInput || (typeof dateInput === 'string' && dateInput.trim() === '')) {
        return null;
    }
    // Handle Excel's numeric date format
    if (typeof dateInput === 'number' && dateInput > 1) {
        const excelEpoch = new Date(1899, 11, 30);
        const parsed = new Date(excelEpoch.getTime() + dateInput * 86400000);
        if (isValid(parsed)) return parsed;
    }
    
    const dateStr = String(dateInput).split(' ')[0]; // Handle datetime strings
    const formats = ['dd-MM-yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd/MM/yyyy'];

    for (const format of formats) {
        const parsedDate = parse(dateStr, format, new Date());
        if (isValid(parsedDate)) {
            return parsedDate;
        }
    }
    
    // Fallback for ISO-like strings
    const isoParsed = new Date(dateInput);
    if(isValid(isoParsed)) return isoParsed;

    return null;
};

export const processClaimsFile = (rawData: ClaimRecord[]): ProcessedData => {
    const df = rawData.map(row => {
        const newRow: ClaimRecord = { ...row };
        const status = String(row['Claim Status'] || '').trim().toUpperCase();

        if (MAP_A.has(status)) {
            newRow['STATUS'] = 'Intimation Pending';
        } else if (MAP_B.has(status)) {
            newRow['STATUS'] = 'Registered with M-Swasth';
        } else if (MAP_C.has(status)) {
            newRow['STATUS'] = 'Under-Process with M-Swasth';
        } else {
            newRow['STATUS'] = 'Unmapped';
        }
        
        const claimFileDate = robustDateParse(row['Claim File Date']);
        const closeDate = robustDateParse(row['Close Date']);
        const claimIntimationDate = robustDateParse(row['Claim Intimation Date']);
        
        newRow['parsedClaimIntimationDate'] = claimIntimationDate;
        
        let tat = NaN;
        if(claimFileDate && closeDate){
            tat = Math.abs(differenceInDays(closeDate, claimFileDate));
        }
        newRow['TAT (in days)'] = tat;

        // Aging Days Bucketing
        if (isNaN(tat)) {
            newRow['Aging Days Bucketing'] = 'Uncategorized';
        } else if (tat <= 7) {
            newRow['Aging Days Bucketing'] = '0-7 Days';
        } else if (tat <= 15) {
            newRow['Aging Days Bucketing'] = '8-15 Days';
        } else if (tat <= 30) {
            newRow['Aging Days Bucketing'] = '16-30 Days';
        } else {
            newRow['Aging Days Bucketing'] = 'Above 30 Days';
        }
        
        // TAT Group
        if (isNaN(tat)) {
            newRow['TAT Group'] = 'Uncategorized';
        } else if (tat <= 10) {
            newRow['TAT Group'] = '0-10';
        } else if (tat <= 20) {
            newRow['TAT Group'] = '11-20';
        } else if (tat <= 30) {
            newRow['TAT Group'] = '21-30';
        } else if (tat <= 50) {
            newRow['TAT Group'] = '31-50';
        } else if (tat <= 100) {
            newRow['TAT Group'] = '51-100';
        } else {
            newRow['TAT Group'] = '100+';
        }
        
        return newRow;
    });

    const df_intimation = df.filter(row => row['STATUS'] === 'Intimation Pending');
    let df_registered = df.filter(row => row['STATUS'] === 'Registered with M-Swasth');
    const df_underprocess = df.filter(row => row['STATUS'] === 'Under-Process with M-Swasth');
    
    // Add "Registered to Insurer" column to the registered dataframe
    df_registered = df_registered.map(row => {
        const claimStatusUpper = String(row['Claim Status'] || '').trim().toUpperCase();
        row['Registered to Insurer'] = STATUS_MAP_REGISTERED[claimStatusUpper] || 'Unmapped';
        return row;
    });

    return { df, df_intimation, df_registered, df_underprocess };
};

const createPivot = (data: ClaimRecord[], category: string): PivotTable => {
    const grouped = data.reduce((acc, row) => {
        const key = String(row[category] || 'Uncategorized');
        if (!acc[key]) {
            acc[key] = { Rows: 0, Claim_Amount: 0, Settled_Amount: 0 };
        }
        acc[key].Rows += 1;
        const claimAmount = safeParseFloat(row['Claim Amount']);
        const settledAmount = safeParseFloat(row['Settled Amount']);
        if(!isNaN(claimAmount)) acc[key].Claim_Amount += claimAmount;
        if(!isNaN(settledAmount)) acc[key].Settled_Amount += settledAmount;
        return acc;
    }, {} as Record<string, { Rows: number; Claim_Amount: number; Settled_Amount: number }>);

    const pivotData = Object.entries(grouped).map(([key, values]) => ({
        [category]: key,
        'Rows': values.Rows,
        'Claim_Amount': values.Claim_Amount,
        'Settled_Amount': values.Settled_Amount,
    }));
    
    pivotData.sort((a, b) => b.Rows - a.Rows);
    
    const totalRows = pivotData.reduce((sum, row) => sum + row.Rows, 0);
    const totalClaim = pivotData.reduce((sum, row) => sum + row.Claim_Amount, 0);
    const totalSettled = pivotData.reduce((sum, row) => sum + row.Settled_Amount, 0);

    pivotData.push({
        [category]: 'TOTAL',
        'Rows': totalRows,
        'Claim_Amount': totalClaim,
        'Settled_Amount': totalSettled,
    });
    
    return pivotData;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₹0';
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const generatePivots = (df_registered: ClaimRecord[]): { pivotDict: PivotDict, kpis: KPIData } => {
    if (!df_registered || df_registered.length === 0) {
        return {
            pivotDict: {},
            kpis: { totalRows: '0', sumClaim: '₹0', sumSettled: '₹0', avgTat: '0.0', totalRowsRaw: 0, sumClaimRaw: 0, sumSettledRaw: 0, avgTatRaw: 0 }
        };
    }
    
    const pivotDict: PivotDict = {};
    PIVOT_CATEGORIES.forEach(category => {
        // Ensure column exists before creating pivot
        if(df_registered.length > 0 && df_registered[0].hasOwnProperty(category)) {
           pivotDict[category] = createPivot(df_registered, category);
        }
    });

    const totalRowsRaw = df_registered.length;
    const sumClaimRaw = df_registered.reduce((sum, row) => sum + (safeParseFloat(row['Claim Amount']) || 0), 0);
    const sumSettledRaw = df_registered.reduce((sum, row) => sum + (safeParseFloat(row['Settled Amount']) || 0), 0);
    
    const tatData = df_registered.map(r => r['TAT (in days)']).filter(t => !isNaN(t) && t !== null);
    const avgTatRaw = tatData.length > 0 ? tatData.reduce((a,b) => a+b, 0) / tatData.length : 0;
    
    const kpis: KPIData = {
        totalRows: totalRowsRaw.toLocaleString('en-IN'),
        sumClaim: formatCurrency(sumClaimRaw),
        sumSettled: formatCurrency(sumSettledRaw),
        avgTat: avgTatRaw.toFixed(1),
        totalRowsRaw,
        sumClaimRaw,
        sumSettledRaw,
        avgTatRaw,
    };

    return { pivotDict, kpis };
};