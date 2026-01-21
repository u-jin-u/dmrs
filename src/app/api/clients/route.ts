/**
 * Clients API Routes
 * GET /api/clients - List all clients
 * POST /api/clients - Create a new client
 */

import { NextRequest, NextResponse } from "next/server";
import { getClients, createClient } from "@/lib/db/queries/clients";
import { ClientStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as ClientStatus | null;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { clients, total } = await getClients({
      status: status || undefined,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      data: clients,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, industry, metaAdsAccountIds, ga4PropertyIds, equals5Enabled } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const client = await createClient({
      name,
      industry,
      metaAdsAccountIds: metaAdsAccountIds || [],
      ga4PropertyIds: ga4PropertyIds || [],
      equals5Enabled: equals5Enabled || false,
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
