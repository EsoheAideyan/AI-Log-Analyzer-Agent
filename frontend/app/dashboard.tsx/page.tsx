"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EventTable from "@/components/EventTable";

export default function DashboardPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch anomalies and timeline in parallel
      const [anomaliesRes, timelineRes] = await Promise.all([
        fetch(`${apiUrl}/api/anomalies`),
        fetch(`${apiUrl}/api/timeline`),
      ]);

      if (!anomaliesRes.ok || !timelineRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const anomaliesData = await anomaliesRes.json();
      const timelineData = await timelineRes.json();

      setAnomalies(anomaliesData.anomalies || []);
      setTimeline(timelineData.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const errorCount = anomalies.filter((a) => a.level === "ERROR" || a.level === "CRITICAL").length;
  const warnCount = anomalies.filter((a) => a.level === "WARN" || a.level === "WARNING").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            View anomalies, errors, and event timeline
          </p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-gray-600">Critical Errors</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-yellow-600">{warnCount}</div>
                <div className="text-gray-600">Warnings</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{anomalies.length}</div>
                <div className="text-gray-600">Total Anomalies</div>
              </div>
            </div>

            {/* Anomalies Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Detected Anomalies</h2>
              {anomalies.length > 0 ? (
                <EventTable events={anomalies} />
              ) : (
                <p className="text-gray-500">No anomalies detected yet. Upload some log files to get started.</p>
              )}
            </div>

            {/* Timeline Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Recent Timeline</h2>
              {timeline.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timeline.slice(0, 50).map((event, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            event.level === "ERROR" || event.level === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : event.level === "WARN"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {event.level || "INFO"}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">{event.source || "N/A"}</span>
                        </div>
                        <div className="text-xs text-gray-500">{event.ts || "N/A"}</div>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">{event.message || event.text || "N/A"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No timeline data available. Upload some log files to get started.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
