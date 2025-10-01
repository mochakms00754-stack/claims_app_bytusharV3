import React from 'react';

interface ThemeSelectorProps {
    theme: string;
    setTheme: (theme: string) => void;
}

const themes = [
    { name: 'light', label: 'Light' },
    { name: 'dark', label: 'Dark' },
    { name: 'retro', label: 'Retro' },
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme }) => {
    return (
        <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">Theme:</p>
             <div className="p-1 bg-muted rounded-lg flex items-center">
                {themes.map((t) => (
                    <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                            theme === t.name ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-card-foreground'
                        }`}
                        aria-pressed={theme === t.name}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
};


interface HeaderProps {
    view: 'v1' | 'v2';
    setView: (view: 'v1' | 'v2') => void;
    isFileLoaded: boolean;
    theme: string;
    setTheme: (theme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView, isFileLoaded, theme, setTheme }) => (
    <header className="bg-card shadow-md sticky top-0 z-20 border-b border-border">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold text-primary">
                Claims Analysis Dashboard
            </h1>
            {isFileLoaded && (
                 <div className="flex items-center gap-4">
                    {view === 'v2' && <ThemeSelector theme={theme} setTheme={setTheme} />}
                    <div className="p-1 bg-muted rounded-lg flex items-center">
                        <button 
                            onClick={() => setView('v1')}
                            className={`px-4 py-1 text-sm font-bold rounded-md transition-all ${view === 'v1' ? 'bg-primary text-white shadow' : 'text-muted-foreground'}`}
                            aria-pressed={view === 'v1'}
                        >
                            V1
                        </button>
                        <button 
                            onClick={() => setView('v2')}
                            className={`px-4 py-1 text-sm font-bold rounded-md transition-all ${view === 'v2' ? 'bg-primary text-white shadow' : 'text-muted-foreground'}`}
                            aria-pressed={view === 'v2'}
                        >
                            V2
                        </button>
                    </div>
                </div>
            )}
        </div>
    </header>
);