import type { GetLeadsParams, Lead, LeadStats, UpdateLeadInput } from "@workspace/shared";

type GoogleScriptResult<T> =
  | T
  | {
      success?: boolean;
      data?: T;
      error?: string;
    };

type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

async function callGoogleScript<T>(
  action: string,
  payload?: Record<string, unknown>,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    throw new Error("GOOGLE_SCRIPT_URL environment variable is not set");
  }

  if (method === "POST") {
    const response = (await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      redirect: "follow",
    })) as FetchResponse;
    if (!response.ok) {
      throw new Error(`Google Script error: ${response.status}`);
    }
    return unwrapGoogleScriptResult<T>((await response.json()) as GoogleScriptResult<T>);
  }

  const params = new URLSearchParams({ action });
  if (payload) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value != null) params.set(key, String(value));
    });
  }

  const response = (await fetch(`${scriptUrl}?${params.toString()}`, {
    redirect: "follow",
  })) as FetchResponse;
  if (!response.ok) {
    throw new Error(`Google Script error: ${response.status}`);
  }
  return unwrapGoogleScriptResult<T>((await response.json()) as GoogleScriptResult<T>);
}

function unwrapGoogleScriptResult<T>(result: GoogleScriptResult<T>): T {
  if (
    result &&
    typeof result === "object" &&
    "success" in result &&
    result.success === false
  ) {
    throw new Error(result.error ?? "Google Script returned an error");
  }

  if (result && typeof result === "object" && "data" in result) {
    return result.data as T;
  }

  return result as T;
}

function normalizeLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id ?? ""),
    timestamp: String(row.timestamp ?? ""),
    salesman: String(row.salesman ?? row.repName ?? ""),
    cxName: String(row.cxName ?? ""),
    cxPhone: String(row.cxPhone ?? ""),
    callSummary: String(row.callSummary ?? ""),
    updatedAt: String(row.updatedAt ?? row.timestamp ?? ""),
  };
}

function normalizeLeads(rows: unknown): Lead[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeLead(row as Record<string, unknown>));
}

function extractSubmission(data: Lead | { submission: Lead }): Lead {
  if (data && typeof data === "object" && "submission" in data) {
    return normalizeLead(data.submission as Record<string, unknown>);
  }
  return normalizeLead(data as Record<string, unknown>);
}

export async function createSubmission(submission: Lead): Promise<Lead> {
  const data = await callGoogleScript<Lead | { submission: Lead }>(
    "createSubmission",
    submission,
    "POST",
  );
  return extractSubmission(data);
}

export async function getAllSubmissions(filters: GetLeadsParams = {}): Promise<Lead[]> {
  const data = await callGoogleScript<Lead[]>(
    "getSubmissions",
    {
      salesman: filters.salesman,
      date: filters.date,
      search: filters.search,
    },
    "GET",
  );
  return normalizeLeads(data);
}

export async function getSubmissionsBySalesman(salesman: string): Promise<Lead[]> {
  const data = await callGoogleScript<Lead[]>(
    "getSubmissionsBySalesman",
    { salesman },
    "GET",
  );
  return normalizeLeads(data);
}

export async function updateSubmissionById(
  id: string,
  update: UpdateLeadInput & { updatedAt: string },
): Promise<Lead> {
  const data = await callGoogleScript<Lead | { submission: Lead }>(
    "updateSubmission",
    { id, ...update },
    "POST",
  );
  return extractSubmission(data);
}

export async function getSubmissionStats(): Promise<LeadStats> {
  const data = await callGoogleScript<LeadStats>("getStats", undefined, "GET");

  return {
    total: Number(data.total ?? 0),
    bySalesman: Array.isArray(data.bySalesman)
      ? data.bySalesman.map((entry) => ({
          salesman: String(entry.salesman),
          count: Number(entry.count),
        }))
      : Array.isArray((data as unknown as { perRep?: Array<{ repName: string; count: number }> }).perRep)
        ? (data as unknown as { perRep: Array<{ repName: string; count: number }> }).perRep.map((entry) => ({
            salesman: String(entry.repName),
            count: Number(entry.count),
          }))
      : [],
  };
}
