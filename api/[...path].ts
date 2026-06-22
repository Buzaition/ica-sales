import app from "../server/src/app";

export default function handler(req: any, res: any) {
  const url = typeof req.url === "string" ? req.url : "/";

  if (!url.startsWith("/api")) {
    req.url = `/api${url.startsWith("/") ? url : `/${url}`}`;
  }

  return app(req, res);
}
