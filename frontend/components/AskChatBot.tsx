'use client';

import React, { useState } from 'react';

export default function AskChatBot() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!query.trim()) return;
        
        setLoading(true);
        setError('');
        
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            
            // Create an AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            const res = await fetch(`${apiUrl}/api/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP ${res.status}: Failed to get response`);
            }
            
            const data = await res.json();
            setResponse(data);
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    setError('Request timed out after 60 seconds. Please try again or check your OpenAI API key.');
                } else {
                    setError(err.message || 'An error occurred');
                }
            } else {
                setError('An unexpected error occurred');
            }
            setResponse(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Ask Chat Bot</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a question about your logs..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Asking...' : 'Ask'}
                    </button>
                </div>
            </form>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error: {error}
                </div>
            )}
            
            {response && (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Answer:</h3>
                        <p className="whitespace-pre-wrap">{response.answer}</p>
                    </div>
                    
                    {response.evidence && response.evidence.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold mb-2">Evidence ({response.evidence.length} results):</h3>
                            <div className="space-y-2">
                                {response.evidence.map((item: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-white rounded border border-blue-200">
                                        <div className="text-sm text-gray-600">
                                            {item.level} | {item.source} | {item.ts}
                                        </div>
                                        <div className="mt-1">{item.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}