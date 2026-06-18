/** Base error for all Inforcer SDK failures. */
export class InforcerError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
    public errorCode?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

/** 401 / invalid credentials. */
export class AuthenticationError extends InforcerError {
  constructor(message: string, response?: unknown, errorCode?: string) {
    super(message, 401, response, errorCode);
  }
}

/** 403 / forbidden — tenant verification or insufficient scope. */
export class ForbiddenError extends InforcerError {
  constructor(message: string, response?: unknown, errorCode?: string) {
    super(message, 403, response, errorCode);
  }
}

/** 404 / tenant or resource not found. */
export class NotFoundError extends InforcerError {
  constructor(message: string, response?: unknown, errorCode?: string) {
    super(message, 404, response, errorCode);
  }
}

/** 429 / quota or rate-limit exceeded. */
export class RateLimitError extends InforcerError {
  constructor(message: string, response?: unknown, errorCode?: string) {
    super(message, 429, response, errorCode);
  }
}

/** 5xx / unexpected server error. */
export class ServerError extends InforcerError {
  constructor(message: string, statusCode = 500, response?: unknown, errorCode?: string) {
    super(message, statusCode, response, errorCode);
  }
}
