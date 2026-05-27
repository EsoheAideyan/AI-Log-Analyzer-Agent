import React from 'react';

export interface Event {
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
    showTitle?: boolean;
}

export default function EventTable({ events, query, showTitle = true }: EventTableProps) {
    const highlightText = (text: string | undefined, searchTerm?: string) => {
        if (!text) return <span className="text-gray-900">N/A</span>;
        const term = typeof searchTerm === 'string' ? searchTerm.trim() : '';
        if (!term) return <span className="text-gray-900">{text}</span>;

        const searchWords = term.split(/\s+/).filter((w) => w.length > 0);
        if (searchWords.length === 0) return <span className="text-gray-900">{text}</span>;

        try {
            // Longer phrases first so "error" does not steal from "error_code" when both appear in query
            const sorted = [...searchWords].sort((a, b) => b.length - a.length);
            const escaped = sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
            const nodes: React.ReactNode[] = [];
            let last = 0;
            let m: RegExpExecArray | null;
            const re = new RegExp(regex.source, regex.flags);
            while ((m = re.exec(text)) !== null) {
                if (m.index > last) {
                    nodes.push(<span key={`t-${last}`}>{text.slice(last, m.index)}</span>);
                }
                nodes.push(
                    <mark key={`m-${m.index}`} className="bg-amber-300 text-gray-900 font-semibold px-0.5 rounded">
                        {m[0]}
                    </mark>
                );
                last = m.index + m[0].length;
                if (m[0].length === 0) re.lastIndex++;
            }
            if (last < text.length) {
                nodes.push(<span key={`t-${last}`}>{text.slice(last)}</span>);
            }
            return <span className="text-gray-900">{nodes}</span>;
        } catch {
            return <span className="text-gray-900">{text}</span>;
        }
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
        <div className={showTitle ? "p-4" : "p-0"}>
            {showTitle && (
                <h1 className="text-2xl font-bold mb-4 text-gray-900">Event Table ({events.length} results)</h1>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border-2 border-gray-400">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border-2 border-gray-400 px-4 py-3 text-left font-bold text-gray-900">Level</th>
                            <th className="border-2 border-gray-400 px-4 py-3 text-left font-bold text-gray-900">Timestamp</th>
                            <th className="border-2 border-gray-400 px-4 py-3 text-left font-bold text-gray-900">Source</th>
                            <th className="border-2 border-gray-400 px-4 py-3 text-left font-bold text-gray-900">Message</th>
                            <th className="border-2 border-gray-400 px-4 py-3 text-left font-bold text-gray-900">Asset</th>
                            {events[0]?.distance !== undefined && (
                                <th className="border-2 border-gray-400 px-4 py-3 text-left font-bold text-gray-900">Distance</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event, idx) => (
                            <tr key={event.id || `event-${idx}`} className="hover:bg-gray-100 bg-white">
                                <td className="border-2 border-gray-300 px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelColor(event.level || 'INFO')}`}>
                                        {event.level || 'INFO'}
                                    </span>
                                </td>
                                <td className="border-2 border-gray-300 px-4 py-3 text-base text-gray-900 font-medium">
                                    {event.ts || 'N/A'}
                                </td>
                                <td className="border-2 border-gray-300 px-4 py-3 text-base text-gray-900 font-medium">
                                    {event.source || 'N/A'}
                                </td>
                                <td className="border-2 border-gray-300 px-4 py-3 text-base text-gray-900">
                                    {highlightText(event.message || event.text, query)}
                                </td>
                                <td className="border-2 border-gray-300 px-4 py-3 text-base text-gray-900 font-medium">
                                    {event.asset || 'N/A'}
                                </td>
                                {event.distance !== undefined && (
                                    <td className="border-2 border-gray-300 px-4 py-3 text-base text-gray-900 font-medium">
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