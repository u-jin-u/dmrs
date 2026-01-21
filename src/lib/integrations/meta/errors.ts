/**
 * Meta Ads Integration Errors
 */

export class MetaIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaIntegrationError";
  }
}

export class MetaAuthError extends MetaIntegrationError {
  constructor(
    message: string,
    public code?: string,
    public description?: string
  ) {
    super(message);
    this.name = "MetaAuthError";
  }
}

export class MetaTokenExpiredError extends MetaAuthError {
  constructor() {
    super("Access token has expired");
    this.name = "MetaTokenExpiredError";
  }
}

export class MetaRateLimitError extends MetaIntegrationError {
  constructor(public retryAfter?: number) {
    super("Rate limit exceeded");
    this.name = "MetaRateLimitError";
  }
}

export class MetaPermissionError extends MetaIntegrationError {
  constructor(
    message: string,
    public missingPermissions?: string[]
  ) {
    super(message);
    this.name = "MetaPermissionError";
  }
}

export class MetaDataFetchError extends MetaIntegrationError {
  constructor(
    message: string,
    public adAccountId?: string
  ) {
    super(message);
    this.name = "MetaDataFetchError";
  }
}
