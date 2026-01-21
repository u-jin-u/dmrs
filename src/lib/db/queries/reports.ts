/**
 * Report Database Queries
 */

import prisma from "../client";
import { Report, ReportStatus, Prisma } from "@prisma/client";

/**
 * Get all reports with optional filtering
 */
export async function getReports(options?: {
  clientId?: string;
  status?: ReportStatus;
  period?: string;
  limit?: number;
  offset?: number;
}): Promise<{ reports: Report[]; total: number }> {
  const where: Prisma.ReportWhereInput = {};

  if (options?.clientId) {
    where.clientId = options.clientId;
  }

  if (options?.status) {
    where.status = options.status;
  }

  if (options?.period) {
    where.period = options.period;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.report.count({ where }),
  ]);

  return { reports, total };
}

/**
 * Get a single report by ID
 */
export async function getReportById(id: string): Promise<Report | null> {
  return prisma.report.findUnique({
    where: { id },
    include: {
      client: true,
      submittedBy: true,
      reviewedBy: true,
      statusHistory: {
        orderBy: { changedAt: "desc" },
      },
    },
  });
}

/**
 * Create a new report
 */
export async function createReport(
  data: Prisma.ReportCreateInput
): Promise<Report> {
  return prisma.report.create({
    data: {
      ...data,
      statusHistory: {
        create: {
          newStatus: ReportStatus.DRAFT,
        },
      },
    },
    include: {
      client: true,
    },
  });
}

/**
 * Update report status with history tracking
 */
export async function updateReportStatus(
  id: string,
  newStatus: ReportStatus,
  options?: {
    userId?: string;
    comment?: string;
  }
): Promise<Report> {
  const current = await prisma.report.findUnique({
    where: { id },
    select: { status: true },
  });

  const updateData: Prisma.ReportUpdateInput = {
    status: newStatus,
    statusHistory: {
      create: {
        oldStatus: current?.status,
        newStatus,
        changedBy: options?.userId,
        comment: options?.comment,
      },
    },
  };

  // Add workflow timestamps
  if (newStatus === ReportStatus.IN_REVIEW) {
    updateData.submittedAt = new Date();
    if (options?.userId) {
      updateData.submittedBy = { connect: { id: options.userId } };
    }
  } else if (newStatus === ReportStatus.APPROVED) {
    updateData.reviewedAt = new Date();
    if (options?.userId) {
      updateData.reviewedBy = { connect: { id: options.userId } };
    }
  } else if (newStatus === ReportStatus.DELIVERED) {
    updateData.deliveredAt = new Date();
  }

  return prisma.report.update({
    where: { id },
    data: updateData,
    include: {
      client: true,
      statusHistory: {
        orderBy: { changedAt: "desc" },
        take: 5,
      },
    },
  });
}

/**
 * Update report content
 */
export async function updateReport(
  id: string,
  data: {
    executiveSummary?: string;
    slidesUrl?: string;
    xlsxUrl?: string;
  }
): Promise<Report> {
  return prisma.report.update({
    where: { id },
    data,
  });
}

/**
 * Reject a report
 */
export async function rejectReport(
  id: string,
  reason: string,
  userId?: string
): Promise<Report> {
  const current = await prisma.report.findUnique({
    where: { id },
    select: { status: true },
  });

  return prisma.report.update({
    where: { id },
    data: {
      status: ReportStatus.DRAFT,
      rejectionReason: reason,
      statusHistory: {
        create: {
          oldStatus: current?.status,
          newStatus: ReportStatus.DRAFT,
          changedBy: userId,
          comment: `Rejected: ${reason}`,
        },
      },
    },
  });
}

/**
 * Get or create report for client/period
 */
export async function getOrCreateReport(
  clientId: string,
  period: string
): Promise<Report> {
  const existing = await prisma.report.findUnique({
    where: {
      clientId_period: { clientId, period },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.report.create({
    data: {
      clientId,
      period,
      statusHistory: {
        create: {
          newStatus: ReportStatus.DRAFT,
        },
      },
    },
  });
}

/**
 * Delete a report
 */
export async function deleteReport(id: string): Promise<void> {
  await prisma.report.delete({ where: { id } });
}
