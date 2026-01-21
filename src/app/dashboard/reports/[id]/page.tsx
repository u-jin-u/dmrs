/**
 * Report Detail Page with Workflow Actions
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportById } from "@/lib/db/queries/reports";
import { ReportStatus } from "@prisma/client";
import { ReportWorkflowActions } from "@/components/reports/workflow-actions";
import { ExecutiveSummaryEditor } from "@/components/reports/summary-editor";

const statusColors: Record<ReportStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  DELIVERED: "bg-blue-100 text-blue-800",
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/reports" className="hover:text-gray-700">
              Reports
            </Link>
            <span>/</span>
            <span>{report.period}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {(report as any).client?.name || "Unknown Client"} - {report.period}
          </h2>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[report.status]}`}>
          {report.status.replace("_", " ")}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Report Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Files</h3>
            <div className="space-y-3">
              {report.slidesUrl ? (
                <a
                  href={report.slidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <p className="font-medium">Google Slides Report</p>
                    <p className="text-sm text-gray-500">Click to open in new tab</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center p-3 border rounded-lg bg-gray-50 text-gray-400">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <p className="font-medium">Google Slides Report</p>
                    <p className="text-sm">Not generated yet</p>
                  </div>
                </div>
              )}

              {report.xlsxUrl ? (
                <a
                  href={report.xlsxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-2xl mr-3">📑</span>
                  <div>
                    <p className="font-medium">Excel Report</p>
                    <p className="text-sm text-gray-500">Click to download</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center p-3 border rounded-lg bg-gray-50 text-gray-400">
                  <span className="text-2xl mr-3">📑</span>
                  <div>
                    <p className="font-medium">Excel Report</p>
                    <p className="text-sm">Not generated yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Executive Summary</h3>
            <ExecutiveSummaryEditor
              reportId={report.id}
              initialSummary={report.executiveSummary || ""}
              isEditable={report.status === ReportStatus.DRAFT}
            />
          </div>

          {/* Status History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
            {(report as any).statusHistory?.length > 0 ? (
              <div className="space-y-3">
                {(report as any).statusHistory.map((history: any) => (
                  <div key={history.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">
                        {history.oldStatus ? `${history.oldStatus} → ` : ""}
                        {history.newStatus}
                      </p>
                      <p className="text-gray-500">
                        {new Date(history.changedAt).toLocaleString()}
                        {history.comment && ` - ${history.comment}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No status changes recorded</p>
            )}
          </div>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Workflow Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <ReportWorkflowActions
              reportId={report.id}
              currentStatus={report.status}
            />
          </div>

          {/* Report Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Information</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Client</dt>
                <dd className="font-medium">
                  <Link
                    href={`/dashboard/clients/${report.clientId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {(report as any).client?.name || "Unknown"}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Period</dt>
                <dd className="font-medium">{report.period}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium">
                  {new Date(report.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {report.submittedAt && (
                <div>
                  <dt className="text-gray-500">Submitted</dt>
                  <dd className="font-medium">
                    {new Date(report.submittedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {report.reviewedAt && (
                <div>
                  <dt className="text-gray-500">Reviewed</dt>
                  <dd className="font-medium">
                    {new Date(report.reviewedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {report.deliveredAt && (
                <div>
                  <dt className="text-gray-500">Delivered</dt>
                  <dd className="font-medium">
                    {new Date(report.deliveredAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Rejection Reason */}
          {report.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-1">Rejection Reason</h4>
              <p className="text-sm text-red-700">{report.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
