/**
 * Marketing Data Database Queries
 */

import prisma from "../client";
import { MetaAdsData, GAData, Equals5Data, ExtractionStatus, Prisma } from "@prisma/client";

/**
 * Save Meta Ads data
 */
export async function saveMetaAdsData(data: {
  clientId: string;
  accountId: string;
  dateStart: Date;
  dateEnd: Date;
  spend: number;
  impressions: bigint | number;
  reach: bigint | number;
  clicks: bigint | number;
  ctr: number;
  campaigns?: any;
}): Promise<MetaAdsData> {
  return prisma.metaAdsData.create({
    data: {
      clientId: data.clientId,
      accountId: data.accountId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      spend: data.spend,
      impressions: BigInt(data.impressions),
      reach: BigInt(data.reach),
      clicks: BigInt(data.clicks),
      ctr: data.ctr,
      campaigns: data.campaigns,
    },
  });
}

/**
 * Get Meta Ads data for client/period
 */
export async function getMetaAdsData(
  clientId: string,
  dateStart: Date,
  dateEnd: Date
): Promise<MetaAdsData | null> {
  return prisma.metaAdsData.findFirst({
    where: {
      clientId,
      dateStart: { gte: dateStart },
      dateEnd: { lte: dateEnd },
    },
    orderBy: { fetchedAt: "desc" },
  });
}

/**
 * Save Google Analytics data
 */
export async function saveGAData(data: {
  clientId: string;
  propertyId: string;
  dateStart: Date;
  dateEnd: Date;
  sessions: bigint | number;
  users: bigint | number;
  newUsers: bigint | number;
  conversions: bigint | number;
  trafficSources?: any;
}): Promise<GAData> {
  return prisma.gAData.create({
    data: {
      clientId: data.clientId,
      propertyId: data.propertyId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      sessions: BigInt(data.sessions),
      users: BigInt(data.users),
      newUsers: BigInt(data.newUsers),
      conversions: BigInt(data.conversions),
      trafficSources: data.trafficSources,
    },
  });
}

/**
 * Get GA data for client/period
 */
export async function getGAData(
  clientId: string,
  dateStart: Date,
  dateEnd: Date
): Promise<GAData | null> {
  return prisma.gAData.findFirst({
    where: {
      clientId,
      dateStart: { gte: dateStart },
      dateEnd: { lte: dateEnd },
    },
    orderBy: { fetchedAt: "desc" },
  });
}

/**
 * Save Equals 5 data
 */
export async function saveEquals5Data(data: {
  clientId: string;
  dateStart: Date;
  dateEnd: Date;
  rawData: any;
  spend?: number;
  impressions?: bigint | number;
  clicks?: bigint | number;
  extractionStatus: ExtractionStatus;
  errorMessage?: string;
  debugScreenshotPath?: string;
}): Promise<Equals5Data> {
  return prisma.equals5Data.create({
    data: {
      clientId: data.clientId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      rawData: data.rawData,
      spend: data.spend,
      impressions: data.impressions ? BigInt(data.impressions) : null,
      clicks: data.clicks ? BigInt(data.clicks) : null,
      extractionStatus: data.extractionStatus,
      errorMessage: data.errorMessage,
      debugScreenshotPath: data.debugScreenshotPath,
    },
  });
}

/**
 * Get Equals 5 data for client/period
 */
export async function getEquals5Data(
  clientId: string,
  dateStart: Date,
  dateEnd: Date
): Promise<Equals5Data | null> {
  return prisma.equals5Data.findFirst({
    where: {
      clientId,
      dateStart: { gte: dateStart },
      dateEnd: { lte: dateEnd },
      extractionStatus: ExtractionStatus.SUCCESS,
    },
    orderBy: { fetchedAt: "desc" },
  });
}

/**
 * Get all marketing data for a client and period
 */
export async function getAllDataForPeriod(
  clientId: string,
  dateStart: Date,
  dateEnd: Date
): Promise<{
  meta: MetaAdsData | null;
  ga: GAData | null;
  equals5: Equals5Data | null;
}> {
  const [meta, ga, equals5] = await Promise.all([
    getMetaAdsData(clientId, dateStart, dateEnd),
    getGAData(clientId, dateStart, dateEnd),
    getEquals5Data(clientId, dateStart, dateEnd),
  ]);

  return { meta, ga, equals5 };
}

/**
 * Check data freshness for a client
 */
export async function getDataStatus(clientId: string): Promise<{
  meta: { lastFetched: Date | null; hasRecent: boolean };
  ga: { lastFetched: Date | null; hasRecent: boolean };
  equals5: { lastFetched: Date | null; hasRecent: boolean; status: ExtractionStatus | null };
}> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [meta, ga, equals5] = await Promise.all([
    prisma.metaAdsData.findFirst({
      where: { clientId },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
    prisma.gAData.findFirst({
      where: { clientId },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
    prisma.equals5Data.findFirst({
      where: { clientId },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true, extractionStatus: true },
    }),
  ]);

  return {
    meta: {
      lastFetched: meta?.fetchedAt || null,
      hasRecent: meta ? meta.fetchedAt > oneWeekAgo : false,
    },
    ga: {
      lastFetched: ga?.fetchedAt || null,
      hasRecent: ga ? ga.fetchedAt > oneWeekAgo : false,
    },
    equals5: {
      lastFetched: equals5?.fetchedAt || null,
      hasRecent: equals5 ? equals5.fetchedAt > oneWeekAgo : false,
      status: equals5?.extractionStatus || null,
    },
  };
}
