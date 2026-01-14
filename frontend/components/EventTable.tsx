import React from 'react';

interface Event {
    id: string;
    file_id?: string;
    line_no?: number;
    ts?: string;
    level?: string;
    source?: string;
    message?: string;
    text?: string;  // Search results use 'text' instead of 'message'
    asset?: string;
    distance?: number;
}

interface EventTableProps {
    events: Event[];
    query?: string;
}

export default function EventTable({ events, query }: EventTableProps) {
    const highlightText = (text: string | undefined, searchTerm?: string) => {
        if (!text) return 'N/A';
        if (!searchTerm) return text;
        
        // Split search term into individual words for better highlighting
        const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0);
        
        if (searchWords.length === 0) return text;
        
        // Create a regex that matches any of the search words
        const escapedWords = searchWords.map(word => 
            word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
        
        // Split text by all search words
        const parts = text.split(regex);
        
        return parts.map((part, i) => {
            // Check if this part matches any search word (case-insensitive)
            const matches = searchWords.some(word => 
                part.toLowerCase() === word.toLowerCase()
            );
            return matches ? (
                <mark key={i} className="bg-yellow-200">{part}</mark>
            ) : (
                <span key={i}>{part}</span>
            );
        });
    };

    const getLevelColor = (level: string) => {
        switch (level?.toUpperCase()) {
            case 'ERROR':
            case 'CRITICAL':
                return 'bg-red-100 text-red-800';
            case 'WARN':
            case 'WARNING':
                return 'bg-yellow-100 text-yellow-800';
            case 'INFO':
                return 'bg-blue-100 text-blue-800';
            case 'DEBUG':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!events || events.length === 0) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Event Table</h1>
                <p className="text-gray-500">No events to display</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Event Table ({events.length} results)</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">Level</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Timestamp</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Source</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Message</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Asset</th>
                            {events[0]?.distance !== undefined && (
                                <th className="border border-gray-300 px-4 py-2 text-left">Distance</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event, idx) => (
                            <tr key={event.id || `event-${idx}`} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelColor(event.level || 'INFO')}`}>
                                        {event.level || 'INFO'}
                                    </span>
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {event.ts || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {event.source || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {highlightText(event.message || event.text, query)}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                    {event.asset || 'N/A'}
                                </td>
                                {event.distance !== undefined && (
                                    <td className="border border-gray-300 px-4 py-2 text-sm">
                                        {event.distance.toFixed(4)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}