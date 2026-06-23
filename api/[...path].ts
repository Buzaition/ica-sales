type VercelRequest = unknown;
type VercelResponse = unknown;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  const { default: app } = await import("../server/src/vercel.js");
  return app(req, res);
}
