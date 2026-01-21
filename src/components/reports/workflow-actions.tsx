/**
 * Report Workflow Actions Component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportStatus } from "@prisma/client";

interface WorkflowActionsProps {
  reportId: string;
  currentStatus: ReportStatus;
}

export function ReportWorkflowActions({ reportId, currentStatus }: WorkflowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const performAction = async (action: string, extraData?: Record<string, string>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, ...extraData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }
    await performAction("reject", { reason: rejectReason });
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Generate Report - Available in DRAFT */}
      {currentStatus === ReportStatus.DRAFT && (
        <button
          onClick={() => performAction("generate")}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Generate Report"}
        </button>
      )}

      {/* Submit for Review - Available in DRAFT */}
      {currentStatus === ReportStatus.DRAFT && (
        <button
          onClick={() => performAction("submit")}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit for Review"}
        </button>
      )}

      {/* Approve - Available in IN_REVIEW */}
      {currentStatus === ReportStatus.IN_REVIEW && (
        <button
          onClick={() => performAction("approve")}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Approving..." : "Approve Report"}
        </button>
      )}

      {/* Reject - Available in IN_REVIEW */}
      {currentStatus === ReportStatus.IN_REVIEW && (
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Reject Report
        </button>
      )}

      {/* Deliver - Available in APPROVED */}
      {currentStatus === ReportStatus.APPROVED && (
        <button
          onClick={() => performAction("deliver")}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Delivering..." : "Deliver to Client"}
        </button>
      )}

      {/* Delivered state - no actions */}
      {currentStatus === ReportStatus.DELIVERED && (
        <p className="text-center text-gray-500 text-sm py-2">
          This report has been delivered.
        </p>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Reject Report</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full border rounded-md p-2 h-24 mb-4 text-gray-900"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
