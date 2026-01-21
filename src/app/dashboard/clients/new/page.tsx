/**
 * New Client Page
 */

import Link from "next/link";
import { NewClientForm } from "./form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
          <p className="text-gray-600">Create a new client for marketing reports</p>
        </div>
        <Link
          href="/dashboard/clients"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Clients
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <NewClientForm />
      </div>
    </div>
  );
}
