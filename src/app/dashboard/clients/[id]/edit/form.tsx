/**
 * Edit Client Form Component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CredentialManager } from "@/components/clients/credential-manager";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  metaAdsAccountIds: string[];
  ga4PropertyIds: string[];
  equals5Enabled: boolean;
  screenshotFolderId: string | null;
  deliveryFolderId: string | null;
  slidesTemplateId: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  credential?: { id: string } | null;
}

interface EditClientFormProps {
  client: Client;
}

export function EditClientForm({ client }: EditClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: client.name,
    industry: client.industry || "",
    status: client.status,
    metaAdsAccountIds: client.metaAdsAccountIds.join(", "),
    ga4PropertyIds: client.ga4PropertyIds.join(", "),
    equals5Enabled: client.equals5Enabled,
    screenshotFolderId: client.screenshotFolderId || "",
    deliveryFolderId: client.deliveryFolderId || "",
    slidesTemplateId: client.slidesTemplateId || "",
    logoUrl: client.logoUrl || "",
    primaryColor: client.primaryColor || "",
    secondaryColor: client.secondaryColor || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.name.trim()) {
      setError("Client name is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          industry: formData.industry.trim() || null,
          status: formData.status,
          metaAdsAccountIds: formData.metaAdsAccountIds
            ? formData.metaAdsAccountIds.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          ga4PropertyIds: formData.ga4PropertyIds
            ? formData.ga4PropertyIds.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          equals5Enabled: formData.equals5Enabled,
          screenshotFolderId: formData.screenshotFolderId.trim() || null,
          deliveryFolderId: formData.deliveryFolderId.trim() || null,
          slidesTemplateId: formData.slidesTemplateId.trim() || null,
          logoUrl: formData.logoUrl.trim() || null,
          primaryColor: formData.primaryColor.trim() || null,
          secondaryColor: formData.secondaryColor.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update client");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/clients/${client.id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
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
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Client updated successfully! Redirecting...
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

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
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Platform Configuration */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Platform Configuration</h3>

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

        {/* Equals 5 Credentials */}
        {formData.equals5Enabled && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Equals 5 Login Credentials</h4>
            <p className="text-xs text-gray-500 mb-3">
              Credentials are encrypted and stored securely for automated data extraction.
            </p>
            <CredentialManager
              clientId={client.id}
              hasCredential={!!client.credential}
            />
          </div>
        )}
      </div>

      {/* Google Drive Configuration */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Google Drive Configuration</h3>

        <div>
          <label htmlFor="screenshotFolderId" className="block text-sm font-medium text-gray-700 mb-1">
            Screenshot Folder ID
          </label>
          <input
            type="text"
            id="screenshotFolderId"
            value={formData.screenshotFolderId}
            onChange={(e) => setFormData({ ...formData, screenshotFolderId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="Google Drive folder ID for screenshots"
          />
        </div>

        <div>
          <label htmlFor="deliveryFolderId" className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Folder ID
          </label>
          <input
            type="text"
            id="deliveryFolderId"
            value={formData.deliveryFolderId}
            onChange={(e) => setFormData({ ...formData, deliveryFolderId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="Google Drive folder ID for report delivery"
          />
        </div>

        <div>
          <label htmlFor="slidesTemplateId" className="block text-sm font-medium text-gray-700 mb-1">
            Slides Template ID
          </label>
          <input
            type="text"
            id="slidesTemplateId"
            value={formData.slidesTemplateId}
            onChange={(e) => setFormData({ ...formData, slidesTemplateId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="Google Slides template document ID"
          />
        </div>
      </div>

      {/* Branding */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Branding</h3>

        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            type="url"
            id="logoUrl"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="primaryColor"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="#3B82F6"
              />
              {formData.primaryColor && (
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: formData.primaryColor }}
                />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="secondaryColor"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="#1E40AF"
              />
              {formData.secondaryColor && (
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: formData.secondaryColor }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t pt-6 flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save Changes"}
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
