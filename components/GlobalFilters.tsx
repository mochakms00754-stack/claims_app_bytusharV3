
import React, { useState, useEffect, useRef } from 'react';
import { V2Filters } from '../App';
import { FilterIcon, ClearIcon } from './icons';

interface GlobalFiltersProps {
    filters: V2Filters;
    setFilters: React.Dispatch<React.SetStateAction<V2Filters | null>>;
    options: Record<string, string[]>;
}

const MultiSelectDropdown: React.FC<{
    name: string;
    options: string[];
    selected: string[];
    onChange: (name: string, newSelected: string[]) => void;
}> = ({ name, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref]);

    const handleSelect = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(name, newSelected);
    };
    
    const label = selected.length > 0 ? `${selected.length} selected` : `Select ${name}`;

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left bg-card border border-border rounded-md shadow-sm px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span className="block truncate">{label}</span>
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-card shadow-lg border border-border rounded-md max-h-60 overflow-auto">
                    {options.map(option => (
                        <label key={option} className="flex items-center px-4 py-2 text-sm text-card-foreground hover:bg-muted cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                checked={selected.includes(option)}
                                onChange={() => handleSelect(option)}
                            />
                            <span className="ml-3">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};


const GlobalFilters: React.FC<GlobalFiltersProps> = ({ filters, setFilters, options }) => {
    
    const handleFilterChange = (key: keyof V2Filters, value: any) => {
        setFilters(prev => (prev ? { ...prev, [key]: value } : null));
    };

    const handleMultiSelectChange = (name: string, newSelected: string[]) => {
        handleFilterChange(name as keyof V2Filters, newSelected);
    };
    
    const resetFilters = () => {
        setFilters({
            dateFrom: '', dateTo: '',
            Region: [], State: [], 'Filed By': [], Product: [], Channel: [], 'Aging Days Bucketing': []
        });
    };
    
    const filterCategories: (keyof V2Filters)[] = ['Region', 'State', 'Filed By', 'Product', 'Channel', 'Aging Days Bucketing'];

    return (
        <div className="bg-card p-4 rounded-xl shadow-md border border-border animate-slide-in-up relative z-10">
            <div className="flex items-center gap-2 mb-4">
                <FilterIcon className="w-6 h-6 text-primary"/>
                <h3 className="text-lg font-bold text-card-foreground">Global Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filters */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">From Date</label>
                    <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} className="w-full bg-card border-border rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">To Date</label>
                    <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} className="w-full bg-card border-border rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                </div>
                
                {/* Spacer for alignment, can be adjusted */}
                <div className="hidden lg:block col-span-2"></div>

                {/* Multi-select Dropdowns */}
                {filterCategories.map(cat => (
                     <div key={cat}>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">{cat}</label>
                        <MultiSelectDropdown 
                           name={cat}
                           options={options[cat] || []}
                           selected={filters[cat] as string[]}
                           onChange={handleMultiSelectChange}
                        />
                    </div>
                ))}

            </div>
             <div className="mt-4 flex justify-end">
                <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                >
                    <ClearIcon className="w-5 h-5"/>
                    Reset Filters
                </button>
            </div>
        </div>
    );
};

export default GlobalFilters;