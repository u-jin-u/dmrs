/**
 * Client Database Queries Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientStatus } from "@prisma/client";

// Create mock at module level using vi.hoisted
const mockPrisma = vi.hoisted(() => ({
  client: {
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
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientWithData,
} from "@/lib/db/queries/clients";

describe("Client Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClients", () => {
    it("should fetch all clients with default pagination", async () => {
      const mockClients = [
        { id: "1", name: "Client A", status: "ACTIVE" },
        { id: "2", name: "Client B", status: "ACTIVE" },
      ];

      mockPrisma.client.findMany.mockResolvedValue(mockClients);
      mockPrisma.client.count.mockResolvedValue(2);

      const result = await getClients();

      expect(result.clients).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: "asc" },
        take: 50,
        skip: 0,
      });
    });

    it("should filter clients by status", async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(0);

      await getClients({ status: ClientStatus.ACTIVE });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ClientStatus.ACTIVE },
        })
      );
    });

    it("should search clients by name or industry", async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(0);

      await getClients({ search: "tech" });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "tech", mode: "insensitive" } },
              { industry: { contains: "tech", mode: "insensitive" } },
            ],
          },
        })
      );
    });

    it("should apply pagination correctly", async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(100);

      await getClients({ limit: 10, offset: 20 });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("getClientById", () => {
    it("should fetch a client by ID with credentials", async () => {
      const mockClient = {
        id: "test-id",
        name: "Test Client",
        credential: { id: "cred-1", platform: "EQUALS5" },
      };

      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await getClientById("test-id");

      expect(result).toEqual(mockClient);
      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: "test-id" },
        include: { credential: true },
      });
    });

    it("should return null for non-existent client", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const result = await getClientById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createClient", () => {
    it("should create a new client with provided data", async () => {
      const clientData = {
        name: "New Client",
        industry: "Technology",
        metaAdsAccountIds: ["acc_123"],
        ga4PropertyIds: ["prop_456"],
        equals5Enabled: true,
      };

      const mockCreatedClient = { id: "new-id", ...clientData };
      mockPrisma.client.create.mockResolvedValue(mockCreatedClient);

      const result = await createClient(clientData);

      expect(result).toEqual(mockCreatedClient);
      expect(mockPrisma.client.create).toHaveBeenCalledWith({ data: clientData });
    });
  });

  describe("updateClient", () => {
    it("should update a client", async () => {
      const updatedClient = { id: "test-id", name: "Updated Name" };
      mockPrisma.client.update.mockResolvedValue(updatedClient);

      const result = await updateClient("test-id", { name: "Updated Name" });

      expect(result).toEqual(updatedClient);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: { name: "Updated Name" },
      });
    });
  });

  describe("deleteClient", () => {
    it("should delete a client", async () => {
      mockPrisma.client.delete.mockResolvedValue({});

      await deleteClient("test-id");

      expect(mockPrisma.client.delete).toHaveBeenCalledWith({
        where: { id: "test-id" },
      });
    });
  });

  describe("getClientWithData", () => {
    it("should fetch client with all related data", async () => {
      const mockClientWithData = {
        id: "test-id",
        name: "Test Client",
        credential: { id: "cred-1" },
        metaAdsData: [{ spend: 1000 }],
        gaData: [{ sessions: 5000 }],
        equals5Data: [{ rawData: {} }],
        reports: [{ id: "report-1", status: "DRAFT" }],
      };

      mockPrisma.client.findUnique.mockResolvedValue(mockClientWithData);

      const result = await getClientWithData("test-id");

      expect(result).toEqual(mockClientWithData);
      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-id" },
          include: expect.objectContaining({
            credential: true,
            metaAdsData: expect.any(Object),
            gaData: expect.any(Object),
            equals5Data: expect.any(Object),
            reports: expect.any(Object),
          }),
        })
      );
    });

    it("should filter data by period when provided", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const period = {
        start: new Date("2024-01-01"),
        end: new Date("2024-01-31"),
      };

      await getClientWithData("test-id", period);

      const call = mockPrisma.client.findUnique.mock.calls[0][0];
      expect(call.include.metaAdsData.where).toMatchObject({
        dateStart: { gte: period.start },
        dateEnd: { lte: period.end },
      });
    });
  });
});
