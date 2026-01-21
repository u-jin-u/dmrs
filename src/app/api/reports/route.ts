/**
 * Reports API Routes
 * GET /api/reports - List all reports
 * POST /api/reports - Create a new report
 */

import { NextRequest, NextResponse } from "next/server";
import { getReports, createReport, getOrCreateReport } from "@/lib/db/queries/reports";
import { ReportStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId") || undefined;
    const status = searchParams.get("status") as ReportStatus | null;
    const period = searchParams.get("period") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { reports, total } = await getReports({
      clientId,
      status: status || undefined,
      period,
      limit,
      offset,
    });

    return NextResponse.json({
      data: reports,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, period } = body;

    if (!clientId || !period) {
      return NextResponse.json(
        { error: "clientId and period are required" },
        { status: 400 }
      );
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "period must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    const report = await getOrCreateReport(clientId, period);

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
