export type ClaimRecord = Record<string, any>;

export interface ProcessedData {
    df: ClaimRecord[];
    df_intimation: ClaimRecord[];
    df_registered: ClaimRecord[];
    df_underprocess: ClaimRecord[];
}

export type PivotTable = Array<Record<string, any>>;

export interface PivotDict {
    [key: string]: PivotTable;
}

export interface KPIData {
    totalRows: string;
    sumClaim: string;
    sumSettled: string;
    avgTat: string;
    totalRowsRaw: number;
    sumClaimRaw: number;
    sumSettledRaw: number;
    avgTatRaw: number;
}