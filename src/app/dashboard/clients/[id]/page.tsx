/**
 * Client Detail Page
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientWithData } from "@/lib/db/queries/clients";
import { CredentialManager } from "@/components/clients/credential-manager";
import { DataStatusCard } from "@/components/clients/data-status";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientWithData(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/clients" className="hover:text-gray-700">
              Clients
            </Link>
            <span>/</span>
            <span>{client.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
          {client.industry && (
            <p className="text-gray-500">{client.industry}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${id}/edit`}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Edit Client
          </Link>
          <Link
            href={`/dashboard/reports/new?clientId=${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generate Report
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Platform Configuration
            </h3>
            <div className="space-y-4">
              {/* Meta Ads */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="text-blue-600">📘</span> Meta Ads
                  </h4>
                  {client.metaAdsAccountIds.length > 0 ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Configured
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      Not configured
                    </span>
                  )}
                </div>
                {client.metaAdsAccountIds.length > 0 ? (
                  <p className="text-sm text-gray-600">
                    Account IDs: {client.metaAdsAccountIds.join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    No Meta Ads accounts linked
                  </p>
                )}
              </div>

              {/* Google Analytics */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="text-yellow-600">📊</span> Google Analytics
                  </h4>
                  {client.ga4PropertyIds.length > 0 ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Configured
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      Not configured
                    </span>
                  )}
                </div>
                {client.ga4PropertyIds.length > 0 ? (
                  <p className="text-sm text-gray-600">
                    Property IDs: {client.ga4PropertyIds.join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    No GA4 properties linked
                  </p>
                )}
              </div>

              {/* Equals 5 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="text-purple-600">🔮</span> Equals 5
                  </h4>
                  {client.equals5Enabled ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Enabled
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      Disabled
                    </span>
                  )}
                </div>
                {client.equals5Enabled ? (
                  <CredentialManager
                    clientId={client.id}
                    hasCredential={!!client.credential}
                  />
                ) : (
                  <p className="text-sm text-gray-400">
                    Equals 5 integration is disabled for this client
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
              <Link
                href={`/dashboard/reports?clientId=${id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {client.reports.length > 0 ? (
              <div className="space-y-2">
                {client.reports.map((report: any) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="font-medium">{report.period}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        report.status === "DELIVERED"
                          ? "bg-blue-100 text-blue-800"
                          : report.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : report.status === "IN_REVIEW"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reports yet</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Data Status */}
          <DataStatusCard clientId={client.id} />

          {/* Client Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      client.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {client.status}
                  </span>
                </dd>
              </div>
              {client.screenshotFolderId && (
                <div>
                  <dt className="text-gray-500">Screenshot Folder</dt>
                  <dd className="font-mono text-xs truncate">
                    {client.screenshotFolderId}
                  </dd>
                </div>
              )}
              {client.deliveryFolderId && (
                <div>
                  <dt className="text-gray-500">Delivery Folder</dt>
                  <dd className="font-mono text-xs truncate">
                    {client.deliveryFolderId}
                  </dd>
                </div>
              )}
              {client.slidesTemplateId && (
                <div>
                  <dt className="text-gray-500">Template</dt>
                  <dd className="font-mono text-xs truncate">
                    {client.slidesTemplateId}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Branding */}
          {(client.logoUrl || client.primaryColor) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Branding</h3>
              <div className="space-y-3">
                {client.logoUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Logo</p>
                    <img
                      src={client.logoUrl}
                      alt={`${client.name} logo`}
                      className="h-12 object-contain"
                    />
                  </div>
                )}
                {client.primaryColor && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Colors</p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: client.primaryColor }}
                        title={`Primary: ${client.primaryColor}`}
                      />
                      {client.secondaryColor && (
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: client.secondaryColor }}
                          title={`Secondary: ${client.secondaryColor}`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
