/**
 * Edit Client Page
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/db/queries/clients";
import { EditClientForm } from "./form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/clients" className="hover:text-gray-700">
              Clients
            </Link>
            <span>/</span>
            <Link href={`/dashboard/clients/${id}`} className="hover:text-gray-700">
              {client.name}
            </Link>
            <span>/</span>
            <span>Edit</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Client</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <EditClientForm client={client} />
      </div>
    </div>
  );
}
