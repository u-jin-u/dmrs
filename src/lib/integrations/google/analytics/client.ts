/**
 * Google Analytics 4 Data API Client
 */

import {
  GA4_API_URL,
  GoogleConfig,
  GA4Property,
  GA4ReportRequest,
  GA4ReportResponse,
  GA4Data,
  PageData,
  SourceData,
  GA4ErrorResponse,
  DEFAULT_GA4_METRICS,
  PAGE_METRICS,
  SOURCE_METRICS,
} from "./types";
import {
  GA4DataFetchError,
  GA4RateLimitError,
  GA4PermissionError,
  GA4PropertyNotFoundError,
} from "./errors";

/**
 * GA4 API Error class
 */
export class GA4ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public status?: string
  ) {
    super(message);
    this.name = "GA4ApiError";
  }

  isRateLimited(): boolean {
    return this.code === 429 || this.status === "RESOURCE_EXHAUSTED";
  }

  isTokenExpired(): boolean {
    return this.code === 401 || this.status === "UNAUTHENTICATED";
  }

  isPermissionError(): boolean {
    return this.code === 403 || this.status === "PERMISSION_DENIED";
  }

  isNotFound(): boolean {
    return this.code === 404 || this.status === "NOT_FOUND";
  }
}

/**
 * Google Analytics 4 Data API client
 */
export class GA4Client {
  private accessToken: string;
  private config?: GoogleConfig;

  constructor(accessToken: string, config?: GoogleConfig) {
    this.accessToken = accessToken;
    this.config = config;
  }

  /**
   * Make authenticated request to GA4 API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${GA4_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as GA4ErrorResponse;
      throw new GA4ApiError(
        errorData.error?.message || "Unknown GA4 API error",
        errorData.error?.code || response.status,
        errorData.error?.status
      );
    }

    return data as T;
  }

  /**
   * List accessible GA4 properties
   */
  async getProperties(): Promise<GA4Property[]> {
    // Use Admin API to list properties
    const adminUrl = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";

    interface AccountSummary {
      account: string;
      displayName: string;
      propertySummaries?: Array<{
        property: string;
        displayName: string;
      }>;
    }

    interface AccountSummariesResponse {
      accountSummaries?: AccountSummary[];
    }

    const response = await this.request<AccountSummariesResponse>(adminUrl);

    const properties: GA4Property[] = [];

    for (const account of response.accountSummaries || []) {
      for (const prop of account.propertySummaries || []) {
        // Extract property ID from "properties/123456789"
        const propertyId = prop.property.split("/").pop() || "";

        properties.push({
          name: prop.property,
          propertyId,
          displayName: prop.displayName,
          timeZone: "UTC", // Would need separate call to get full details
          currencyCode: "USD",
        });
      }
    }

    return properties;
  }

  /**
   * Run a report query
   */
  async runReport(request: GA4ReportRequest): Promise<GA4ReportResponse> {
    const endpoint = `/properties/${request.propertyId}:runReport`;

    const body = {
      dateRanges: request.dateRanges,
      dimensions: request.dimensions,
      metrics: request.metrics,
      limit: request.limit,
      offset: request.offset,
      orderBys: request.orderBys,
      dimensionFilter: request.dimensionFilter,
      metricFilter: request.metricFilter,
    };

    return this.request<GA4ReportResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Get overview metrics for a property
   */
  async getOverviewMetrics(
    propertyId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<GA4ReportResponse> {
    return this.runReport({
      propertyId,
      dateRanges: [
        {
          startDate: this.formatDate(dateStart),
          endDate: this.formatDate(dateEnd),
        },
      ],
      metrics: DEFAULT_GA4_METRICS.map((name) => ({ name })),
    });
  }

  /**
   * Get top pages report
   */
  async getTopPages(
    propertyId: string,
    dateStart: Date,
    dateEnd: Date,
    limit = 10
  ): Promise<GA4ReportResponse> {
    return this.runReport({
      propertyId,
      dateRanges: [
        {
          startDate: this.formatDate(dateStart),
          endDate: this.formatDate(dateEnd),
        },
      ],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: PAGE_METRICS.map((name) => ({ name })),
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    });
  }

  /**
   * Get traffic sources report
   */
  async getTrafficSources(
    propertyId: string,
    dateStart: Date,
    dateEnd: Date,
    limit = 10
  ): Promise<GA4ReportResponse> {
    return this.runReport({
      propertyId,
      dateRanges: [
        {
          startDate: this.formatDate(dateStart),
          endDate: this.formatDate(dateEnd),
        },
      ],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: SOURCE_METRICS.map((name) => ({ name })),
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit,
    });
  }

  /**
   * Fetch all data for a property
   */
  async fetchData(
    propertyId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<GA4Data> {
    try {
      // Fetch all reports in parallel
      const [overviewResponse, pagesResponse, sourcesResponse] =
        await Promise.all([
          this.getOverviewMetrics(propertyId, dateStart, dateEnd),
          this.getTopPages(propertyId, dateStart, dateEnd),
          this.getTrafficSources(propertyId, dateStart, dateEnd),
        ]);

      // Parse overview metrics
      const overview = this.parseOverviewMetrics(overviewResponse);

      // Parse top pages
      const topPages = this.parseTopPages(pagesResponse);

      // Parse traffic sources
      const topSources = this.parseTrafficSources(sourcesResponse);

      return {
        propertyId,
        dateStart,
        dateEnd,
        ...overview,
        topPages,
        topSources,
        fetchedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof GA4ApiError) {
        if (error.isNotFound()) {
          throw new GA4PropertyNotFoundError(propertyId);
        }
        if (error.isPermissionError()) {
          throw new GA4PermissionError(
            "Insufficient permissions to access this property",
            propertyId
          );
        }
        if (error.isRateLimited()) {
          throw new GA4RateLimitError();
        }
      }
      throw error;
    }
  }

  /**
   * Parse overview metrics from response
   */
  private parseOverviewMetrics(response: GA4ReportResponse): Omit<
    GA4Data,
    "propertyId" | "dateStart" | "dateEnd" | "topPages" | "topSources" | "fetchedAt"
  > {
    const row = response.rows?.[0];
    const metrics = response.metricHeaders?.map((h) => h.name) || [];
    const values = row?.metricValues?.map((v) => v.value) || [];

    const getValue = (name: string): number => {
      const index = metrics.indexOf(name);
      return index >= 0 ? parseFloat(values[index]) || 0 : 0;
    };

    return {
      sessions: getValue("sessions"),
      users: getValue("totalUsers"),
      newUsers: getValue("newUsers"),
      pageviews: getValue("screenPageViews"),
      bounceRate: getValue("bounceRate"),
      avgSessionDuration: getValue("averageSessionDuration"),
      eventsPerSession: getValue("eventsPerSession"),
      engagementRate: getValue("engagementRate"),
    };
  }

  /**
   * Parse top pages from response
   */
  private parseTopPages(response: GA4ReportResponse): PageData[] {
    const rows = response.rows || [];
    const metrics = response.metricHeaders?.map((h) => h.name) || [];

    return rows.map((row) => {
      const dimensions = row.dimensionValues || [];
      const values = row.metricValues?.map((v) => v.value) || [];

      const getValue = (name: string): number => {
        const index = metrics.indexOf(name);
        return index >= 0 ? parseFloat(values[index]) || 0 : 0;
      };

      return {
        pagePath: dimensions[0]?.value || "",
        pageTitle: dimensions[1]?.value || "",
        pageviews: getValue("screenPageViews"),
        uniquePageviews: getValue("sessions"),
        avgTimeOnPage: getValue("averageSessionDuration"),
        bounceRate: getValue("bounceRate"),
      };
    });
  }

  /**
   * Parse traffic sources from response
   */
  private parseTrafficSources(response: GA4ReportResponse): SourceData[] {
    const rows = response.rows || [];
    const metrics = response.metricHeaders?.map((h) => h.name) || [];

    return rows.map((row) => {
      const dimensions = row.dimensionValues || [];
      const values = row.metricValues?.map((v) => v.value) || [];

      const getValue = (name: string): number => {
        const index = metrics.indexOf(name);
        return index >= 0 ? parseFloat(values[index]) || 0 : 0;
      };

      return {
        source: dimensions[0]?.value || "(direct)",
        medium: dimensions[1]?.value || "(none)",
        sessions: getValue("sessions"),
        users: getValue("totalUsers"),
        newUsers: getValue("newUsers"),
        bounceRate: getValue("bounceRate"),
      };
    });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
