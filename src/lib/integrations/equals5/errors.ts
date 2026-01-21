/**
 * Equals 5 Custom Errors
 */

export class Equals5Error extends Error {
  constructor(
    message: string,
    public readonly screenshotPath?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "Equals5Error";
  }
}

export class LoginError extends Equals5Error {
  constructor(message: string, screenshotPath?: string) {
    super(`Login failed: ${message}`, screenshotPath);
    this.name = "LoginError";
  }
}

export class NavigationError extends Equals5Error {
  constructor(message: string, screenshotPath?: string) {
    super(`Navigation failed: ${message}`, screenshotPath);
    this.name = "NavigationError";
  }
}

export class ExtractionError extends Equals5Error {
  constructor(message: string, screenshotPath?: string) {
    super(`Data extraction failed: ${message}`, screenshotPath);
    this.name = "ExtractionError";
  }
}

export class MfaRequiredError extends Equals5Error {
  constructor(message: string = "MFA required but no secret configured") {
    super(message);
    this.name = "MfaRequiredError";
  }
}

export class TimeoutError extends Equals5Error {
  constructor(operation: string, screenshotPath?: string) {
    super(`Timeout during: ${operation}`, screenshotPath);
    this.name = "TimeoutError";
  }
}
