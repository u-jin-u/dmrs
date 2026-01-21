/**
 * New Report Page
 * Select client and period to generate a report
 */

import Link from "next/link";
import { getClients } from "@/lib/db/queries/clients";
import { NewReportForm } from "./form";

export default async function NewReportPage() {
  const { clients } = await getClients({ limit: 100 });

  // Generate period options (last 12 months)
  const periods: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    periods.push(period);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Generate Report</h2>
          <p className="text-gray-600">Select a client and period to create a new report</p>
        </div>
        <Link
          href="/dashboard/reports"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Reports
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        {clients.length > 0 ? (
          <NewReportForm clients={clients} periods={periods} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No clients found. Create a client first.</p>
            <Link
              href="/dashboard/clients/new"
              className="text-blue-600 hover:underline"
            >
              Create your first client
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
