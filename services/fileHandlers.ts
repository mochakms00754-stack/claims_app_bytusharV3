
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ClaimRecord } from '../types';

export const parseFile = (file: File): Promise<ClaimRecord[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const binaryStr = event.target?.result;
                if (!binaryStr) {
                    reject(new Error("File content is empty."));
                    return;
                }

                if (file.name.endsWith('.csv')) {
                    Papa.parse(binaryStr as string, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            resolve(results.data as ClaimRecord[]);
                        },
                        error: (error: any) => {
                            reject(new Error(`CSV parsing error: ${error.message}`));
                        }
                    });
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const workbook = XLSX.read(binaryStr, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                    resolve(jsonData as ClaimRecord[]);
                } else {
                    reject(new Error("Unsupported file type. Please upload a CSV or XLSX file."));
                }
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(new Error(`File reading error: ${error}`));
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
};
