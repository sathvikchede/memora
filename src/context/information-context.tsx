"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Entry {
    id: string;
    text: string;
    contributor: string;
    date: string;
    type: 'add' | 'help' | 'message';
    status?: 'success' | 'adjusted' | 'mismatch';
}

interface InformationContextType {
    entries: Entry[];
    addEntry: (entry: Entry) => void;
}

const InformationContext = createContext<InformationContextType | undefined>(undefined);

export const InformationProvider = ({ children }: { children: ReactNode }) => {
    const [entries, setEntries] = useState<Entry[]>([]);

    const addEntry = (entry: Entry) => {
        setEntries(prevEntries => [...prevEntries, entry]);
    };

    return (
        <InformationContext.Provider value={{ entries, addEntry }}>
            {children}
        </InformationContext.Provider>
    );
};

export const useInformation = () => {
    const context = useContext(InformationContext);
    if (context === undefined) {
        throw new Error('useInformation must be used within an InformationProvider');
    }
    return context;
};