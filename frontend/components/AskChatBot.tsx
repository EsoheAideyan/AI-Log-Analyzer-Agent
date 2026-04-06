'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PaginationControls from '@/components/PaginationControls';

const EVIDENCE_PAGE_SIZE = 10;

export default function AskChatBot() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [evidencePage, setEvidencePage] = useState(1);
    const searchParams = useSearchParams();

    useEffect(() => {
        setEvidencePage(1);
    }, [response]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const file_id = searchParams.get('file_id');
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
                body: JSON.stringify({ query, ...(file_id ? { file_id } : {}) }),
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

    const scopedFileId = searchParams.get('file_id');
    const evidenceList: any[] = response?.evidence ?? [];
    const evidencePaged = evidenceList.slice(
        (evidencePage - 1) * EVIDENCE_PAGE_SIZE,
        evidencePage * EVIDENCE_PAGE_SIZE
    );

    return (
        <div className="p-4 text-gray-900">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Ask Chat Bot</h1>
            {scopedFileId && (
                <p className="mb-4 text-sm text-gray-900">
                    Answering using log lines from this upload only.{' '}
                    <Link href="/chat" className="text-blue-600 hover:underline">Ask across all logs</Link>
                </p>
            )}
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a question about your logs..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className={`p-4 rounded-lg border ${response.no_grounding_match ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className="font-semibold mb-2 text-gray-900">Answer:</h3>
                        <p className="whitespace-pre-wrap text-gray-900">{response.answer}</p>
                    </div>
                    
                    {evidenceList.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h3 className="font-semibold mb-2 text-gray-900">Evidence ({evidenceList.length} results):</h3>
                            <div className="space-y-2">
                                {evidencePaged.map((item: any, idx: number) => (
                                    <div key={(evidencePage - 1) * EVIDENCE_PAGE_SIZE + idx} className="p-2 bg-white rounded border border-blue-200">
                                        <div className="text-sm text-gray-900">
                                            {item.level} | {item.source} | {item.ts}
                                        </div>
                                        <div className="mt-1 text-gray-900">{item.text}</div>
                                    </div>
                                ))}
                            </div>
                            <PaginationControls
                                page={evidencePage}
                                pageSize={EVIDENCE_PAGE_SIZE}
                                totalCount={evidenceList.length}
                                onPageChange={setEvidencePage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}