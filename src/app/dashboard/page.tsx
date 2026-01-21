/**
 * Dashboard Overview Page
 */

import Link from "next/link";

async function getStats() {
  // In production, this would fetch from the database
  return {
    totalClients: 0,
    activeReports: 0,
    pendingApproval: 0,
    deliveredThisMonth: 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your marketing reports</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          href="/dashboard/clients"
        />
        <StatCard
          title="Active Reports"
          value={stats.activeReports}
          href="/dashboard/reports?status=DRAFT"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          href="/dashboard/reports?status=IN_REVIEW"
          highlight
        />
        <StatCard
          title="Delivered This Month"
          value={stats.deliveredThisMonth}
          href="/dashboard/reports?status=DELIVERED"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/reports/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Generate New Report
          </Link>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Add New Client
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Reports
        </h3>
        <p className="text-gray-500 text-sm">
          No recent reports. Create your first report to get started.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  highlight = false,
}: {
  title: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block p-6 rounded-lg shadow ${
        highlight ? "bg-blue-50 border-2 border-blue-200" : "bg-white"
      } hover:shadow-md transition-shadow`}
    >
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${highlight ? "text-blue-600" : "text-gray-900"}`}>
        {value}
      </p>
    </Link>
  );
}
