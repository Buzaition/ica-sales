import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type {
  AuthUser,
  ErrorResponse,
  GetLeadsParams,
  HealthStatus,
  Lead,
  LeadInput,
  LeadStats,
  LoginInput,
  SuccessResponse,
  UpdateLeadInput,
} from "@workspace/shared";

type BodyType<T> = T;
type AwaitedInput<T> = PromiseLike<T> | T;
type AwaitedValue<T> = T extends AwaitedInput<infer U> ? U : never;

type RequestOptions = RequestInit & {
  responseType?: "json" | "text" | "auto";
};

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;

  constructor(response: Response, data: T | null) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${response.status} ${response.statusText}`;
    super(message);
    this.name = "ApiError";
    this.status = response.status;
    this.data = data;
  }
}

type ErrorType<T = unknown> = ApiError<T>;

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiFetch<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { headers, responseType = "json", ...init } = options;
  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const data = responseType === "text" ? await response.text() : await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response, data as ErrorResponse);
  }

  return data as T;
}

export const getHealthCheckUrl = () => "/api/healthz";
export const healthCheck = (options?: RequestInit): Promise<HealthStatus> =>
  apiFetch<HealthStatus>(getHealthCheckUrl(), { ...options, method: "GET" });

export const getHealthCheckQueryKey = () => ["/api/healthz"] as const;

export function useHealthCheck<
  TData = AwaitedValue<ReturnType<typeof healthCheck>>,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: UseQueryOptions<AwaitedValue<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: RequestInit;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = options?.query?.queryKey ?? getHealthCheckQueryKey();
  const queryFn: QueryFunction<AwaitedValue<ReturnType<typeof healthCheck>>> = ({ signal }) =>
    healthCheck({ signal, ...options?.request });
  const query = useQuery({ queryKey, queryFn, ...options?.query }) as UseQueryResult<
    TData,
    TError
  > & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const getLoginUrl = () => "/api/auth/login";
export const login = (loginInput: LoginInput, options?: RequestInit): Promise<AuthUser> =>
  apiFetch<AuthUser>(getLoginUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(loginInput),
  });

export const useLogin = <TError = ErrorType<ErrorResponse>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      AwaitedValue<ReturnType<typeof login>>,
      TError,
      { data: BodyType<LoginInput> },
      TContext
    >;
    request?: RequestInit;
  },
): UseMutationResult<
  AwaitedValue<ReturnType<typeof login>>,
  TError,
  { data: BodyType<LoginInput> },
  TContext
> => {
  const mutationFn: MutationFunction<
    AwaitedValue<ReturnType<typeof login>>,
    { data: BodyType<LoginInput> }
  > = ({ data }) => login(data, options?.request);
  return useMutation({ mutationKey: ["login"], mutationFn, ...options?.mutation });
};

export const getLogoutUrl = () => "/api/auth/logout";
export const logout = (options?: RequestInit): Promise<SuccessResponse> =>
  apiFetch<SuccessResponse>(getLogoutUrl(), { ...options, method: "POST" });

export const useLogout = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<AwaitedValue<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: RequestInit;
  },
): UseMutationResult<AwaitedValue<ReturnType<typeof logout>>, TError, void, TContext> => {
  const mutationFn: MutationFunction<AwaitedValue<ReturnType<typeof logout>>, void> = () =>
    logout(options?.request);
  return useMutation({ mutationKey: ["logout"], mutationFn, ...options?.mutation });
};

export const getGetMeUrl = () => "/api/auth/me";
export const getMe = (options?: RequestInit): Promise<AuthUser> =>
  apiFetch<AuthUser>(getGetMeUrl(), { ...options, method: "GET" });

export const getGetMeQueryKey = () => ["/api/auth/me"] as const;

export function useGetMe<
  TData = AwaitedValue<ReturnType<typeof getMe>>,
  TError = ErrorType<ErrorResponse>,
>(
  options?: {
    query?: UseQueryOptions<AwaitedValue<ReturnType<typeof getMe>>, TError, TData>;
    request?: RequestInit;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = options?.query?.queryKey ?? getGetMeQueryKey();
  const queryFn: QueryFunction<AwaitedValue<ReturnType<typeof getMe>>> = ({ signal }) =>
    getMe({ signal, ...options?.request });
  const query = useQuery({ queryKey, queryFn, ...options?.query }) as UseQueryResult<
    TData,
    TError
  > & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const getSubmitLeadUrl = () => "/api/leads";
export const submitLead = (leadInput: LeadInput, options?: RequestInit): Promise<Lead> =>
  apiFetch<Lead>(getSubmitLeadUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(leadInput),
  });

export const useSubmitLead = <TError = ErrorType<ErrorResponse>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      AwaitedValue<ReturnType<typeof submitLead>>,
      TError,
      { data: BodyType<LeadInput> },
      TContext
    >;
    request?: RequestInit;
  },
): UseMutationResult<
  AwaitedValue<ReturnType<typeof submitLead>>,
  TError,
  { data: BodyType<LeadInput> },
  TContext
> => {
  const mutationFn: MutationFunction<
    AwaitedValue<ReturnType<typeof submitLead>>,
    { data: BodyType<LeadInput> }
  > = ({ data }) => submitLead(data, options?.request);
  return useMutation({ mutationKey: ["submitLead"], mutationFn, ...options?.mutation });
};

export const getMyLeadsUrl = () => "/api/leads/my";
export const getMyLeads = (options?: RequestInit): Promise<Lead[]> =>
  apiFetch<Lead[]>(getMyLeadsUrl(), { ...options, method: "GET" });

export const getMyLeadsQueryKey = () => ["/api/leads/my"] as const;

export function useGetMyLeads<
  TData = AwaitedValue<ReturnType<typeof getMyLeads>>,
  TError = ErrorType<ErrorResponse>,
>(
  options?: {
    query?: UseQueryOptions<AwaitedValue<ReturnType<typeof getMyLeads>>, TError, TData>;
    request?: RequestInit;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = options?.query?.queryKey ?? getMyLeadsQueryKey();
  const queryFn: QueryFunction<AwaitedValue<ReturnType<typeof getMyLeads>>> = ({ signal }) =>
    getMyLeads({ signal, ...options?.request });
  const query = useQuery({ queryKey, queryFn, ...options?.query }) as UseQueryResult<
    TData,
    TError
  > & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const getUpdateLeadUrl = (id: string) => `/api/leads/${encodeURIComponent(id)}`;
export const updateLead = (
  id: string,
  leadInput: UpdateLeadInput,
  options?: RequestInit,
): Promise<Lead> =>
  apiFetch<Lead>(getUpdateLeadUrl(id), {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(leadInput),
  });

export const useUpdateLead = <TError = ErrorType<ErrorResponse>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      AwaitedValue<ReturnType<typeof updateLead>>,
      TError,
      { id: string; data: BodyType<UpdateLeadInput> },
      TContext
    >;
    request?: RequestInit;
  },
): UseMutationResult<
  AwaitedValue<ReturnType<typeof updateLead>>,
  TError,
  { id: string; data: BodyType<UpdateLeadInput> },
  TContext
> => {
  const mutationFn: MutationFunction<
    AwaitedValue<ReturnType<typeof updateLead>>,
    { id: string; data: BodyType<UpdateLeadInput> }
  > = ({ id, data }) => updateLead(id, data, options?.request);
  return useMutation({ mutationKey: ["updateLead"], mutationFn, ...options?.mutation });
};

export const getGetLeadsUrl = (params?: GetLeadsParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) normalizedParams.append(key, String(value));
  });

  const query = normalizedParams.toString();
  return query ? `/api/leads?${query}` : "/api/leads";
};

export const getLeads = (params?: GetLeadsParams, options?: RequestInit): Promise<Lead[]> =>
  apiFetch<Lead[]>(getGetLeadsUrl(params), { ...options, method: "GET" });

export const getGetLeadsQueryKey = (params?: GetLeadsParams) =>
  ["/api/leads", ...(params ? [params] : [])] as const;

export function useGetLeads<
  TData = AwaitedValue<ReturnType<typeof getLeads>>,
  TError = ErrorType<ErrorResponse>,
>(
  params?: GetLeadsParams,
  options?: {
    query?: UseQueryOptions<AwaitedValue<ReturnType<typeof getLeads>>, TError, TData>;
    request?: RequestInit;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = options?.query?.queryKey ?? getGetLeadsQueryKey(params);
  const queryFn: QueryFunction<AwaitedValue<ReturnType<typeof getLeads>>> = ({ signal }) =>
    getLeads(params, { signal, ...options?.request });
  const query = useQuery({ queryKey, queryFn, ...options?.query }) as UseQueryResult<
    TData,
    TError
  > & { queryKey: QueryKey };
  return { ...query, queryKey };
}

export const getGetLeadStatsUrl = () => "/api/leads/stats";
export const getLeadStats = (options?: RequestInit): Promise<LeadStats> =>
  apiFetch<LeadStats>(getGetLeadStatsUrl(), { ...options, method: "GET" });

export const getGetLeadStatsQueryKey = () => ["/api/leads/stats"] as const;

export function useGetLeadStats<
  TData = AwaitedValue<ReturnType<typeof getLeadStats>>,
  TError = ErrorType<ErrorResponse>,
>(
  options?: {
    query?: UseQueryOptions<AwaitedValue<ReturnType<typeof getLeadStats>>, TError, TData>;
    request?: RequestInit;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = options?.query?.queryKey ?? getGetLeadStatsQueryKey();
  const queryFn: QueryFunction<AwaitedValue<ReturnType<typeof getLeadStats>>> = ({ signal }) =>
    getLeadStats({ signal, ...options?.request });
  const query = useQuery({ queryKey, queryFn, ...options?.query }) as UseQueryResult<
    TData,
    TError
  > & { queryKey: QueryKey };
  return { ...query, queryKey };
}
