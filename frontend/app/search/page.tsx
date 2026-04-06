"use client";

import { Suspense, useState } from "react";
import EventTable from "@/components/EventTable";
import PaginationControls from "@/components/PaginationControls";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SearchPageInner() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const searchParams = useSearchParams();
  const fileId = searchParams.get("file_id");

  const handleSearch = async (e: React.FormEvent | null, page: number = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    if (e !== null) {
      setCurrentPage(1);
      page = 1;
    } else {
      setCurrentPage(page);
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          page,
          page_size: pageSize,
          ...(fileId ? { file_id: fileId } : {}),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          (errBody as { detail?: string }).detail || "Search failed"
        );
      }

      const data = await response.json();
      setResults(data.results || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-700 mt-2">
            Find what you&apos;re looking for using simple words
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for errors, connection issues, specific events..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-base font-medium placeholder:text-gray-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results ({totalCount > 0 ? totalCount : results.length})
            </h2>
            <EventTable events={results} query={query} showTitle={false} />

            <PaginationControls
              page={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={(p) => handleSearch(null, p)}
              disabled={loading}
            />
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && query && !error && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded">
            <p className="font-medium">No matching log lines</p>
            <p className="mt-1 text-sm">
              Nothing in your indexed logs was similar enough to that search. Try different
              keywords, a shorter phrase, or upload logs that contain related messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700">
          Loading search…
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
