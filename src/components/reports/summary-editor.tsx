/**
 * Executive Summary Editor Component
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SummaryEditorProps {
  reportId: string;
  initialSummary: string;
  isEditable: boolean;
}

export function ExecutiveSummaryEditor({
  reportId,
  initialSummary,
  isEditable,
}: SummaryEditorProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executiveSummary: summary }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaved(true);
      setIsEditing(false);
      router.refresh();

      // Clear saved message after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSummary(initialSummary);
    setIsEditing(false);
    setError(null);
  };

  if (!isEditable && !summary) {
    return (
      <p className="text-gray-500 text-sm italic">
        No executive summary provided.
      </p>
    );
  }

  if (!isEditable) {
    return (
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-gray-700">{summary}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          Summary saved successfully!
        </div>
      )}

      {isEditing ? (
        <>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border rounded-md p-3 h-48 text-sm"
            placeholder="Enter executive summary highlights, key metrics, and recommendations..."
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          {summary ? (
            <div className="whitespace-pre-wrap text-gray-700 text-sm border rounded-md p-3 bg-gray-50">
              {summary}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic border rounded-md p-3 bg-gray-50">
              Click Edit to add an executive summary...
            </p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            Edit Summary
          </button>
        </>
      )}
    </div>
  );
}
