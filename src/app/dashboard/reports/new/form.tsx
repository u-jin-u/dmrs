/**
 * New Report Form Component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
}

interface NewReportFormProps {
  clients: Client[];
  periods: string[];
}

export function NewReportForm({ clients, periods }: NewReportFormProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [period, setPeriod] = useState(periods[0] || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!clientId || !period) {
      setError("Please select a client and period");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create report");
      }

      const { data: report } = await response.json();
      router.push(`/dashboard/reports/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  // Format period for display (e.g., "2024-01" -> "January 2024")
  const formatPeriod = (p: string) => {
    const [year, month] = p.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
          Client
        </label>
        <select
          id="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          required
        >
          <option value="">Select a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
          Report Period
        </label>
        <select
          id="period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          required
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {formatPeriod(p)}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Report"}
        </button>
      </div>
    </form>
  );
}
