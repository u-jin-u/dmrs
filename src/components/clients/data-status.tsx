/**
 * Data Status Card Component
 */

"use client";

import { useState, useEffect } from "react";

interface DataStatusCardProps {
  clientId: string;
}

interface DataStatus {
  meta: { lastFetched: string | null; hasRecent: boolean };
  ga: { lastFetched: string | null; hasRecent: boolean };
  equals5: { lastFetched: string | null; hasRecent: boolean; status: string | null };
}

export function DataStatusCard({ clientId }: DataStatusCardProps) {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [clientId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/data/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data.status);
      }
    } catch (err) {
      console.error("Failed to fetch data status:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerFetch = async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/data/${clientId}/fetch`, {
        method: "POST",
      });
      if (response.ok) {
        // Refresh status after fetch
        await fetchStatus();
      }
    } catch (err) {
      console.error("Failed to trigger data fetch:", err);
    } finally {
      setFetching(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Status</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Data Status</h3>
        <button
          onClick={triggerFetch}
          disabled={fetching}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {fetching ? "Fetching..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {/* Meta Ads */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status?.meta.hasRecent ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span>Meta Ads</span>
          </div>
          <span className="text-gray-500">{formatDate(status?.meta.lastFetched ?? null)}</span>
        </div>

        {/* Google Analytics */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status?.ga.hasRecent ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span>Google Analytics</span>
          </div>
          <span className="text-gray-500">{formatDate(status?.ga.lastFetched ?? null)}</span>
        </div>

        {/* Equals 5 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status?.equals5.hasRecent && status?.equals5.status === "SUCCESS"
                  ? "bg-green-500"
                  : status?.equals5.status === "FAILED"
                  ? "bg-red-500"
                  : "bg-gray-300"
              }`}
            />
            <span>Equals 5</span>
          </div>
          <span className="text-gray-500">
            {status?.equals5.status === "FAILED"
              ? "Failed"
              : formatDate(status?.equals5.lastFetched ?? null)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-400">
          Green = data fetched within last 7 days
        </p>
      </div>
    </div>
  );
}
