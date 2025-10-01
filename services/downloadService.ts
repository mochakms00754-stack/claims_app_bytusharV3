import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessedData, PivotDict, ClaimRecord, PivotTable } from '../types';
import { PIVOT_CATEGORIES } from '../constants';

const createWorkbook = (): XLSX.WorkBook => XLSX.utils.book_new();

const addSheet = (workbook: XLSX.WorkBook, data: any[], sheetName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

const downloadWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'arraybuffer' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
    saveAs(data, fileName);
};

export const generateEnrichedExcel = async (data: ProcessedData) => {
    const workbook = createWorkbook();
    addSheet(workbook, data.df, 'MASTER');
    addSheet(workbook, data.df_intimation, 'Intimation Pending');
    addSheet(workbook, data.df_registered, 'Registered M-Swasth');
    addSheet(workbook, data.df_underprocess, 'Under-Process M-Swasth');
    downloadWorkbook(workbook, 'claims_enriched.xlsx');
};

export const generatePivotsExcel = async (pivotDict: PivotDict) => {
    const workbook = createWorkbook();
    for (const [sheetName, pivotData] of Object.entries(pivotDict)) {
        addSheet(workbook, pivotData, sheetName.substring(0, 31));
    }
    downloadWorkbook(workbook, 'Registered_with_M-Swasth_Pivots.xlsx');
};

const makePivotForDownload = (df: ClaimRecord[], indexCol: string) => {
     if (!df.length || !df[0].hasOwnProperty(indexCol)) {
        return [];
    }
    const groups = df.reduce((acc, row) => {
        const key = String(row[indexCol] || 'N/A');
        if (!acc[key]) {
            acc[key] = { Rows: 0, Claim_Amount: 0, Settled_Amount: 0 };
        }
        acc[key].Rows++;
        const claimAmount = parseFloat(String(row["Claim Amount"] || '0').replace(/,/g, ''));
        const settledAmount = parseFloat(String(row["Settled Amount"] || '0').replace(/,/g, ''));
        acc[key].Claim_Amount += isNaN(claimAmount) ? 0 : claimAmount;
        acc[key].Settled_Amount += isNaN(settledAmount) ? 0 : settledAmount;
        return acc;
    }, {} as Record<string, { Rows: number; Claim_Amount: number; Settled_Amount: number }>);

    const pivotData = Object.entries(groups).map(([key, values]) => ({
        [indexCol]: key,
        ...values,
    }));
    
    pivotData.sort((a, b) => b.Rows - a.Rows);
    return pivotData;
}

export const generatePartnerZips = async (df_registered: ClaimRecord[]) => {
    const zip = new JSZip();
    
    const groups = df_registered.reduce((acc, row) => {
        const channel = String(row['Channel'] || 'Unknown');
        if (!acc[channel]) {
            acc[channel] = [];
        }
        acc[channel].push(row);
        return acc;
    }, {} as Record<string, ClaimRecord[]>);
    
    for (const [channel, data] of Object.entries(groups)) {
        if (channel === 'Unknown' || data.length === 0) continue;
        
        const workbook = createWorkbook();
        PIVOT_CATEGORIES.forEach(category => {
            const pivotData = makePivotForDownload(data, category);
            if (pivotData.length > 0) {
                 addSheet(workbook, pivotData, category.substring(0, 31));
            }
        });
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'arraybuffer' });
        const cleanChannelName = channel.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, '_').substring(0, 50);
        zip.file(`pivot_${cleanChannelName}.xlsx`, excelBuffer);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'partnerwise_pivots.zip');
};

export const convertToCSV = (tableData: PivotTable, separator = ','): string => {
    if (!tableData || tableData.length === 0) return '';
    const headers = Object.keys(tableData[0]);
    const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(separator);

    const rows = tableData.map(row =>
        headers.map(header => {
            let cellData = String(row[header] ?? '');
            if (cellData.includes(separator) || cellData.includes('\n') || cellData.includes('"')) {
                cellData = `"${cellData.replace(/"/g, '""')}"`;
            }
            return cellData;
        }).join(separator)
    );
    return [headerRow, ...rows].join('\n');
};

export const generatePivotsCsvZip = async (pivotDict: PivotDict) => {
    const zip = new JSZip();
    
    for (const [sheetName, pivotData] of Object.entries(pivotDict)) {
        const safeName = sheetName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const csvString = convertToCSV(pivotData);
        zip.file(`${safeName}.csv`, `\uFEFF${csvString}`);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'all_pivots_csv.zip');
};