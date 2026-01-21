/**
 * New Client Form Component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewClientForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    metaAdsAccountIds: "",
    ga4PropertyIds: "",
    equals5Enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Client name is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          industry: formData.industry.trim() || null,
          metaAdsAccountIds: formData.metaAdsAccountIds
            ? formData.metaAdsAccountIds.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          ga4PropertyIds: formData.ga4PropertyIds
            ? formData.ga4PropertyIds.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          equals5Enabled: formData.equals5Enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create client");
      }

      const { data: client } = await response.json();
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Client Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          placeholder="e.g., Acme Corporation"
          required
        />
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
          Industry
        </label>
        <input
          type="text"
          id="industry"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          placeholder="e.g., Technology, Healthcare, Retail"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Configuration</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="metaAdsAccountIds" className="block text-sm font-medium text-gray-700 mb-1">
              Meta Ads Account IDs
            </label>
            <input
              type="text"
              id="metaAdsAccountIds"
              value={formData.metaAdsAccountIds}
              onChange={(e) => setFormData({ ...formData, metaAdsAccountIds: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Comma-separated, e.g., act_123456, act_789012"
            />
            <p className="mt-1 text-sm text-gray-500">Enter Meta Ads account IDs (optional)</p>
          </div>

          <div>
            <label htmlFor="ga4PropertyIds" className="block text-sm font-medium text-gray-700 mb-1">
              Google Analytics 4 Property IDs
            </label>
            <input
              type="text"
              id="ga4PropertyIds"
              value={formData.ga4PropertyIds}
              onChange={(e) => setFormData({ ...formData, ga4PropertyIds: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Comma-separated, e.g., 123456789, 987654321"
            />
            <p className="mt-1 text-sm text-gray-500">Enter GA4 property IDs (optional)</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="equals5Enabled"
              checked={formData.equals5Enabled}
              onChange={(e) => setFormData({ ...formData, equals5Enabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="equals5Enabled" className="ml-2 block text-sm text-gray-700">
              Enable Equals 5 integration
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4 flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Client"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
