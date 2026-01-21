/**
 * Report Database Queries Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportStatus } from "@prisma/client";

// Create mock at module level using vi.hoisted
const mockPrisma = vi.hoisted(() => ({
  report: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

// Mock the db client module
vi.mock("@/lib/db/client", () => ({
  default: mockPrisma,
}));

// Import after mock setup
import {
  getReports,
  getReportById,
  createReport,
  updateReportStatus,
  updateReport,
  rejectReport,
  getOrCreateReport,
  deleteReport,
} from "@/lib/db/queries/reports";

describe("Report Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getReports", () => {
    it("should fetch all reports with default pagination", async () => {
      const mockReports = [
        { id: "1", period: "2024-01", status: "DRAFT", client: { id: "c1", name: "Client 1" } },
        { id: "2", period: "2024-01", status: "APPROVED", client: { id: "c2", name: "Client 2" } },
      ];

      mockPrisma.report.findMany.mockResolvedValue(mockReports);
      mockPrisma.report.count.mockResolvedValue(2);

      const result = await getReports();

      expect(result.reports).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: "desc" },
          take: 50,
          skip: 0,
        })
      );
    });

    it("should filter reports by clientId", async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await getReports({ clientId: "client-123" });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: "client-123" },
        })
      );
    });

    it("should filter reports by status", async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await getReports({ status: ReportStatus.IN_REVIEW });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReportStatus.IN_REVIEW },
        })
      );
    });

    it("should filter reports by period", async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await getReports({ period: "2024-01" });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { period: "2024-01" },
        })
      );
    });

    it("should apply multiple filters", async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await getReports({
        clientId: "client-123",
        status: ReportStatus.DRAFT,
        period: "2024-01",
        limit: 10,
        offset: 5,
      });

      expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            clientId: "client-123",
            status: ReportStatus.DRAFT,
            period: "2024-01",
          },
          take: 10,
          skip: 5,
        })
      );
    });
  });

  describe("getReportById", () => {
    it("should fetch report with all related data", async () => {
      const mockReport = {
        id: "report-1",
        period: "2024-01",
        status: "DRAFT",
        client: { id: "client-1", name: "Test Client" },
        submittedBy: null,
        reviewedBy: null,
        statusHistory: [{ id: "sh-1", newStatus: "DRAFT" }],
      };

      mockPrisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await getReportById("report-1");

      expect(result).toEqual(mockReport);
      expect(mockPrisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: "report-1" },
        include: {
          client: true,
          submittedBy: true,
          reviewedBy: true,
          statusHistory: {
            orderBy: { changedAt: "desc" },
          },
        },
      });
    });

    it("should return null for non-existent report", async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      const result = await getReportById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createReport", () => {
    it("should create report with initial DRAFT status", async () => {
      const mockCreatedReport = {
        id: "new-report",
        clientId: "client-1",
        period: "2024-01",
        status: "DRAFT",
        client: { id: "client-1", name: "Test Client" },
      };

      mockPrisma.report.create.mockResolvedValue(mockCreatedReport);

      const result = await createReport({
        client: { connect: { id: "client-1" } },
        period: "2024-01",
      });

      expect(result).toEqual(mockCreatedReport);
      expect(mockPrisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusHistory: {
              create: { newStatus: ReportStatus.DRAFT },
            },
          }),
        })
      );
    });
  });

  describe("updateReportStatus", () => {
    it("should update status to IN_REVIEW with timestamp", async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ status: ReportStatus.DRAFT });
      mockPrisma.report.update.mockResolvedValue({ id: "report-1", status: "IN_REVIEW" });

      await updateReportStatus("report-1", ReportStatus.IN_REVIEW, {
        userId: "user-1",
      });

      const updateCall = mockPrisma.report.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(ReportStatus.IN_REVIEW);
      expect(updateCall.data.submittedAt).toBeDefined();
      expect(updateCall.data.submittedBy).toEqual({ connect: { id: "user-1" } });
    });

    it("should update status to APPROVED with timestamp", async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ status: ReportStatus.IN_REVIEW });
      mockPrisma.report.update.mockResolvedValue({ id: "report-1", status: "APPROVED" });

      await updateReportStatus("report-1", ReportStatus.APPROVED, {
        userId: "manager-1",
      });

      const updateCall = mockPrisma.report.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(ReportStatus.APPROVED);
      expect(updateCall.data.reviewedAt).toBeDefined();
      expect(updateCall.data.reviewedBy).toEqual({ connect: { id: "manager-1" } });
    });

    it("should update status to DELIVERED with timestamp", async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ status: ReportStatus.APPROVED });
      mockPrisma.report.update.mockResolvedValue({ id: "report-1", status: "DELIVERED" });

      await updateReportStatus("report-1", ReportStatus.DELIVERED);

      const updateCall = mockPrisma.report.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(ReportStatus.DELIVERED);
      expect(updateCall.data.deliveredAt).toBeDefined();
    });

    it("should create status history entry", async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ status: ReportStatus.DRAFT });
      mockPrisma.report.update.mockResolvedValue({});

      await updateReportStatus("report-1", ReportStatus.IN_REVIEW, {
        userId: "user-1",
        comment: "Ready for review",
      });

      const updateCall = mockPrisma.report.update.mock.calls[0][0];
      expect(updateCall.data.statusHistory.create).toMatchObject({
        oldStatus: ReportStatus.DRAFT,
        newStatus: ReportStatus.IN_REVIEW,
        changedBy: "user-1",
        comment: "Ready for review",
      });
    });
  });

  describe("updateReport", () => {
    it("should update report content", async () => {
      mockPrisma.report.update.mockResolvedValue({
        id: "report-1",
        executiveSummary: "Updated summary",
        slidesUrl: "https://slides.example.com",
      });

      await updateReport("report-1", {
        executiveSummary: "Updated summary",
        slidesUrl: "https://slides.example.com",
      });

      expect(mockPrisma.report.update).toHaveBeenCalledWith({
        where: { id: "report-1" },
        data: {
          executiveSummary: "Updated summary",
          slidesUrl: "https://slides.example.com",
        },
      });
    });
  });

  describe("rejectReport", () => {
    it("should reject report with reason", async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ status: ReportStatus.IN_REVIEW });
      mockPrisma.report.update.mockResolvedValue({ id: "report-1", status: "DRAFT" });

      await rejectReport("report-1", "Data incomplete", "manager-1");

      expect(mockPrisma.report.update).toHaveBeenCalledWith({
        where: { id: "report-1" },
        data: expect.objectContaining({
          status: ReportStatus.DRAFT,
          rejectionReason: "Data incomplete",
          statusHistory: {
            create: expect.objectContaining({
              oldStatus: ReportStatus.IN_REVIEW,
              newStatus: ReportStatus.DRAFT,
              changedBy: "manager-1",
              comment: "Rejected: Data incomplete",
            }),
          },
        }),
      });
    });
  });

  describe("getOrCreateReport", () => {
    it("should return existing report if found", async () => {
      const existingReport = {
        id: "existing-report",
        clientId: "client-1",
        period: "2024-01",
      };

      mockPrisma.report.findUnique.mockResolvedValue(existingReport);

      const result = await getOrCreateReport("client-1", "2024-01");

      expect(result).toEqual(existingReport);
      expect(mockPrisma.report.create).not.toHaveBeenCalled();
    });

    it("should create new report if not found", async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      const newReport = {
        id: "new-report",
        clientId: "client-1",
        period: "2024-01",
      };
      mockPrisma.report.create.mockResolvedValue(newReport);

      const result = await getOrCreateReport("client-1", "2024-01");

      expect(result).toEqual(newReport);
      expect(mockPrisma.report.create).toHaveBeenCalledWith({
        data: {
          clientId: "client-1",
          period: "2024-01",
          statusHistory: {
            create: { newStatus: ReportStatus.DRAFT },
          },
        },
      });
    });
  });

  describe("deleteReport", () => {
    it("should delete a report", async () => {
      mockPrisma.report.delete.mockResolvedValue({});

      await deleteReport("report-1");

      expect(mockPrisma.report.delete).toHaveBeenCalledWith({
        where: { id: "report-1" },
      });
    });
  });
});
