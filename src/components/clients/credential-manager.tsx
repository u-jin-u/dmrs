/**
 * Equals 5 Credential Manager Component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CredentialManagerProps {
  clientId: string;
  hasCredential: boolean;
}

export function CredentialManager({ clientId, hasCredential }: CredentialManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientId,
          platform: "equals5",
          credentials: formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save credentials");
      }

      setShowForm(false);
      setFormData({ username: "", password: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete these credentials?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/credentials/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete credentials");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    handleSubmit();
  };

  if (showForm) {
    return (
      <div className="space-y-3 mt-3">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setFormData({ username: "", password: "" });
            }}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Credentials"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      {hasCredential ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600">
            ✓ Credentials stored securely
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Update
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Equals 5 credentials
        </button>
      )}
    </div>
  );
}
