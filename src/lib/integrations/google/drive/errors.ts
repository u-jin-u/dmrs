/**
 * Google Drive Integration Errors
 */

export class DriveIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveIntegrationError";
  }
}

export class DriveAuthError extends DriveIntegrationError {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "DriveAuthError";
  }
}

export class DriveTokenExpiredError extends DriveAuthError {
  constructor() {
    super("Access token has expired");
    this.name = "DriveTokenExpiredError";
  }
}

export class DriveRateLimitError extends DriveIntegrationError {
  constructor(public retryAfter?: number) {
    super("Rate limit exceeded");
    this.name = "DriveRateLimitError";
  }
}

export class DrivePermissionError extends DriveIntegrationError {
  constructor(
    message: string,
    public fileId?: string
  ) {
    super(message);
    this.name = "DrivePermissionError";
  }
}

export class DriveFileNotFoundError extends DriveIntegrationError {
  constructor(fileId: string) {
    super(`File not found: ${fileId}`);
    this.name = "DriveFileNotFoundError";
  }
}

export class DriveFolderNotFoundError extends DriveIntegrationError {
  constructor(folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = "DriveFolderNotFoundError";
  }
}

export class DriveUploadError extends DriveIntegrationError {
  constructor(
    message: string,
    public fileName?: string
  ) {
    super(message);
    this.name = "DriveUploadError";
  }
}

export class DriveDownloadError extends DriveIntegrationError {
  constructor(
    message: string,
    public fileId?: string
  ) {
    super(message);
    this.name = "DriveDownloadError";
  }
}
