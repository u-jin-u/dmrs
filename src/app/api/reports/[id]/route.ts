/**
 * Report Detail API Routes
 * GET /api/reports/:id - Get report details
 * PUT /api/reports/:id - Update report
 * DELETE /api/reports/:id - Delete report
 */

import { NextRequest, NextResponse } from "next/server";
import { getReportById, updateReport, deleteReport, updateReportStatus, rejectReport } from "@/lib/db/queries/reports";
import { ReportStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const report = await getReportById(id);

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getReportById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Handle status changes
    if (body.action) {
      const { action, userId, comment, reason } = body;

      let report;
      switch (action) {
        case "submit":
          report = await updateReportStatus(id, ReportStatus.IN_REVIEW, { userId, comment });
          break;
        case "approve":
          report = await updateReportStatus(id, ReportStatus.APPROVED, { userId, comment });
          break;
        case "deliver":
          report = await updateReportStatus(id, ReportStatus.DELIVERED, { userId, comment });
          break;
        case "reject":
          if (!reason) {
            return NextResponse.json(
              { error: "Rejection reason is required" },
              { status: 400 }
            );
          }
          report = await rejectReport(id, reason, userId);
          break;
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }

      return NextResponse.json({ data: report });
    }

    // Handle content updates
    const { executiveSummary, slidesUrl, xlsxUrl } = body;
    const report = await updateReport(id, {
      executiveSummary,
      slidesUrl,
      xlsxUrl,
    });

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await getReportById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    await deleteReport(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
