/**
 * Google Analytics Integration Errors
 */

export class GA4IntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GA4IntegrationError";
  }
}

export class GA4AuthError extends GA4IntegrationError {
  constructor(
    message: string,
    public code?: string,
    public description?: string
  ) {
    super(message);
    this.name = "GA4AuthError";
  }
}

export class GA4TokenExpiredError extends GA4AuthError {
  constructor() {
    super("Access token has expired");
    this.name = "GA4TokenExpiredError";
  }
}

export class GA4RefreshTokenError extends GA4AuthError {
  constructor(message = "Failed to refresh access token") {
    super(message);
    this.name = "GA4RefreshTokenError";
  }
}

export class GA4RateLimitError extends GA4IntegrationError {
  constructor(public retryAfter?: number) {
    super("Rate limit exceeded");
    this.name = "GA4RateLimitError";
  }
}

export class GA4PermissionError extends GA4IntegrationError {
  constructor(
    message: string,
    public propertyId?: string
  ) {
    super(message);
    this.name = "GA4PermissionError";
  }
}

export class GA4DataFetchError extends GA4IntegrationError {
  constructor(
    message: string,
    public propertyId?: string
  ) {
    super(message);
    this.name = "GA4DataFetchError";
  }
}

export class GA4PropertyNotFoundError extends GA4IntegrationError {
  constructor(propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = "GA4PropertyNotFoundError";
  }
}
