// Status mappings for the main "STATUS" column classification
export const MAP_A = new Set([
    'INTIMATION',
    'INFO COLLECTION'
]);

export const MAP_B = new Set([
    'SETTLED',
    'REJECTED',
    'PENDING APPROVAL INSURANCE',
    'RAISE_CLAIMDOC_3',
    'MORE INFO',
    'APPROVED'
]);

export const MAP_C = new Set([
    'PENDING APPROVAL M-INSURE',
    'SUBMISSION APPROVAL INSURANCE'
]);

// Status mappings for the "Registered to Insurer" column within the registered dataset
export const STATUS_MAP_REGISTERED: { [key: string]: string } = {
    'MORE INFO': 'Requirement Raised for Documents – Actionable from Partner',
    'RAISE_CLAIMDOC_3': 'Requirement Raised for Documents – Actionable from Partner',
    'PENDING APPROVAL INSURANCE': 'Under-Process with M-Swasth',
    'REJECTED': 'Repudiated',
    'SETTLED': 'Settled',
    'APPROVED': 'APPROVED',
};

// Defines the categories for which pivot tables will be generated
export const PIVOT_CATEGORIES: string[] = [
    'Registered to Insurer',
    'Aging Days Bucketing',
    'TAT Group',
    'Customer Gender',
    'Construct Type',
    'Branch',
    'Region',
    'State',
    'Filed By',
    'Product',
    'Payment Done',
];

// Defines which charts should be rendered horizontally due to high cardinality
export const HIGH_CARDINALITY_CHARTS: Set<string> = new Set([
    'Branch',
    'Region',
    'State',
    'Filed By',
    'Product'
]);
