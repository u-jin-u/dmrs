/**
 * Client Database Queries
 */

import prisma from "../client";
import { Client, ClientStatus, Prisma } from "@prisma/client";

/**
 * Get all clients with optional filtering
 */
export async function getClients(options?: {
  status?: ClientStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ clients: Client[]; total: number }> {
  const where: Prisma.ClientWhereInput = {};

  if (options?.status) {
    where.status = options.status;
  }

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { industry: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total };
}

/**
 * Get a single client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  return prisma.client.findUnique({
    where: { id },
    include: {
      credential: true,
    },
  });
}

/**
 * Create a new client
 */
export async function createClient(
  data: Prisma.ClientCreateInput
): Promise<Client> {
  return prisma.client.create({ data });
}

/**
 * Update a client
 */
export async function updateClient(
  id: string,
  data: Prisma.ClientUpdateInput
): Promise<Client> {
  return prisma.client.update({
    where: { id },
    data,
  });
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  await prisma.client.delete({ where: { id } });
}

/**
 * Get client with all related data
 */
export async function getClientWithData(
  id: string,
  period?: { start: Date; end: Date }
): Promise<Client & {
  metaAdsData: any[];
  gaData: any[];
  equals5Data: any[];
  reports: any[];
} | null> {
  const dateFilter = period
    ? {
        dateStart: { gte: period.start },
        dateEnd: { lte: period.end },
      }
    : {};

  return prisma.client.findUnique({
    where: { id },
    include: {
      credential: true,
      metaAdsData: {
        where: dateFilter,
        orderBy: { dateStart: "desc" },
        take: 1,
      },
      gaData: {
        where: dateFilter,
        orderBy: { dateStart: "desc" },
        take: 1,
      },
      equals5Data: {
        where: dateFilter,
        orderBy: { dateStart: "desc" },
        take: 1,
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}
