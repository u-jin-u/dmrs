/**
 * Marketing Data API Routes
 * GET /api/data/:clientId - Get all marketing data for a client
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllDataForPeriod, getDataStatus } from "@/lib/db/queries/data";
import { getClientById } from "@/lib/db/queries/clients";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Check client exists
    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // If period specified, get data for that period
    const period = searchParams.get("period");
    if (period) {
      // Parse YYYY-MM format
      const [year, month] = period.split("-").map(Number);
      const dateStart = new Date(year, month - 1, 1);
      const dateEnd = new Date(year, month, 0); // Last day of month

      const data = await getAllDataForPeriod(clientId, dateStart, dateEnd);

      return NextResponse.json({
        data: {
          meta: data.meta ? serializeData(data.meta) : null,
          ga: data.ga ? serializeData(data.ga) : null,
          equals5: data.equals5 ? serializeData(data.equals5) : null,
        },
        period: {
          start: dateStart.toISOString(),
          end: dateEnd.toISOString(),
        },
      });
    }

    // Otherwise return status
    const status = await getDataStatus(clientId);

    return NextResponse.json({
      data: {
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// Helper to serialize BigInt values
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}
