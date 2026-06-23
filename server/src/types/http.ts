export type RouteLogger = {
  error(details: unknown, message?: string): void;
  info(details: unknown, message?: string): void;
  warn(details: unknown, message?: string): void;
};

export type RouteRequest = {
  body?: unknown;
  log: RouteLogger;
  params?: Record<string, string | undefined>;
  query?: unknown;
};

export type RouteResponse = {
  json(body: unknown): unknown;
  status(code: number): RouteResponse;
};
