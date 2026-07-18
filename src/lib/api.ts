export type AdminUserListMetrics = {
  total_users?: number;
  hosts_count?: number;
  staff_count?: number;
  verified_identity_count?: number;
  created_this_month?: number;
  created_previous_month?: number;
  created_today?: number;
  created_last_30_days?: number;
  created_this_week?: number;
  created_previous_week?: number;
  rolling_7d?: number;
  rolling_prev_7d?: number;
  rolling_prev_30d?: number;
  daily_signups_last_30_days?: { date: string; count: number }[];
};

export type AdminMobileAIInsights = {
  investment_enabled_phones: number;
  ai_active_phones_30d: number;
  ai_active_phones_all_time: number;
};

export type NewHomesNotificationSummary = {
  total_sent: number;
  unique_users: number;
  unique_devices: number;
  last_sent_at?: string | null;
  last_24h_sent: number;
  last_7d_sent: number;
  throttled_now_count?: number;
};

export type NewHomesNotificationDaily = {
  day: string;
  sent_count: number;
  unique_users: number;
  unique_devices: number;
};

export type NewHomesNotificationTopProperty = {
  property_kind: "rent" | "sale" | string;
  reference_id: number;
  title: string;
  city: string;
  sent_count: number;
  unique_users: number;
  unique_devices: number;
  last_sent_at?: string | null;
};

export type NewHomesNotificationRecentDelivery = {
  sent_at: string;
  user_id: number;
  property_kind: "rent" | "sale" | string;
  reference_id: number;
  title: string;
  city: string;
  device_count: number;
};

export type NewHomesNotificationAnalytics = {
  summary: NewHomesNotificationSummary;
  daily: NewHomesNotificationDaily[];
  top_properties: NewHomesNotificationTopProperty[];
  recent_deliveries: NewHomesNotificationRecentDelivery[];
  device_timing_details?: NewHomesNotificationDeviceTiming[];
};

export type NewHomesNotificationDeviceTiming = {
  device_id: number;
  user_id?: number | null;
  platform: string;
  locale: string;
  app_version: string;
  last_sent_at?: string | null;
  next_send_at?: string | null;
  is_throttled: boolean;
  updated_at: string;
};

export type NewHomesNotificationDeviceTimingResponse = {
  data: NewHomesNotificationDeviceTiming[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    only_throttled?: boolean;
    user_id?: number | null;
    platform?: string | null;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    metrics?: AdminUserListMetrics;
  };
  links?: Record<string, string>;
};

export type AdminUser = {
  ID: number;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  avatarURL?: string;
  bio?: string;
  dateOfBirth?: string;
  languages?: string[];
  socialLogin?: boolean;
  socialProvider?: string;
  verificationStatus?: string; // pending, verified, rejected
  isVerified?: boolean;
  trueBroker?: boolean; // admin-verified broker; all their properties show TrueBroker
  true_broker?: boolean; // snake_case from API
  broker_status?: string; // none, pending, approved, rejected
  broker_id?: string;
  broker_verified_at?: string;
  idType?: string;
  idNumber?: string;
  idFrontImage?: string;
  idBackImage?: string;
  selfieImage?: string;
  CreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminHostStats = {
  total_properties?: number;
  approved_properties?: number;
  total_reservations?: number;
  member_since?: string;
};

export type AdminProperty = {
  ID: number;
  title: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status?: string;
  isFlagged?: boolean;
  flagReason?: string;
  hostID?: number;
  images?: string[] | { url?: string; src?: string }[];
  coverImage?: string;
  thumbnailURL?: string;
  host?: AdminUser;
  description?: string;
  amenities?: string[] | { name?: string }[];
  nightlyPrice?: number;
  cleaningFee?: number;
  serviceFee?: number;
  currency?: string;
  cancellationPolicy?: string;
  propertyType?: string;
  addressLine1?: string;
  addressLine2?: string;
  lat?: number;
  lng?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  capacity?: number;
  houseRules?: string;
  rating?: number;
  isActive?: boolean;
  reviewNotes?: string;
  review_notes?: string;
  note?: string;
  hostPrivateNote?: string;
  host_private_note?: string;
  reviews?: any[];
  reservations?: any[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminExperience = {
  ID: number;
  title: string;
  status?: string;
  hostID?: number;
  city?: string;
  country?: string;
  description?: string;
  language?: string;
  focus?: string;
  hasHostedBefore?: boolean;
  hostedFor?: string;
  duration?: number; // minutes
  whatWeDo?: string;
  whatToBring?: string;
  bringRequired?: boolean;
  minAge?: number;
  maxAge?: number;
  activityLevel?: string;
  difficultyLevel?: string;
  groupSize?: number;
  startTime?: string;
  endTime?: string;
  pricePerPerson?: number;
  groupDiscounts?: any;
  arrivalTime?: number;
  cancellationPolicy?: string;
  videoURL?: string;
  photos?: any[];
  images?: string[] | { url?: string; src?: string }[];
  thumbnailURL?: string;
  coverImage?: string;
  capacity?: number; // map from groupSize
  currency?: string;
  rating?: number;
  reviewsCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  identityVerified?: boolean;
  reviewStatus?: string;
  reviewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
  host?: Pick<AdminUser, "ID" | "firstName" | "lastName" | "avatarURL">;
};

export type AdminStats = {
  pending_properties: number;
  pending_property_sales?: number;
  pending_landmarks?: number;
  pending_verifications: number;
  pending_broker_verifications?: number;
  pending_videos: number;
  new_reservations_7d: number;
  new_reservations_30d: number;
};

export type PendingBrokerVerification = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  avatarURL?: string;
  broker_status?: string;
  broker_submitted_at?: string;
  spoken_languages?: string[];
  id_type?: string;
  id_front_image?: string;
  id_back_image?: string;
  selfie_image?: string;
  license_url?: string;
};

export type ModerationPendingKind = "rent" | "sale" | "land";

export type ModerationPendingItem = {
  kind: ModerationPendingKind;
  id: number;
  title: string;
  image_url: string;
  city: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ModerationPendingSummary = {
  counts: {
    rent: number;
    sale: number;
    land: number;
    total: number;
  };
  items: ModerationPendingItem[];
};

export type AdminReservation = {
  ID: number;
  propertyID: number;
  guestID: number;
  status: string;
  checkIn?: string;
  checkOut?: string;
  property?: AdminProperty;
  guest?: AdminUser;
};

export type AdminReview = {
  ID: number;
  userID: number;
  propertyID: number;
  stars: number;
  title?: string;
  body?: string;
};

export type AdminFeedback = {
  ID: number;
  userID: number;
  title?: string;
  message: string;
  rating?: number;
  context?: string;
  appVersion?: string;
  deviceInfo?: string;
  createdAt?: string;
  user?: AdminUser;
};

// MeskenyGPT AI interactions
export type AdminAIInteraction = {
  id: number;
  session_id: string;
  user_id?: number | null;
  turn_index: number;
  lang: string;
  intent: string;
  user_message: string;
  system_prompt?: string;
  ai_response: string;
  model_used: string;
  tokens_used: number;
  latency_ms: number;
  cities: string;
  zones: string;
  property_type: string;
  budget: string;
  purpose: string;
  created_at: string;
  thumbs_up: number;
  thumbs_down: number;
};

// Crash Logs Types
export type AdminCrashLog = {
  id: number;
  created_at: string;
  error: string;
  stack?: string;
  component_stack?: string;
  phase: string;
  screen: string;
  context_parsed?: Record<string, any>;
  platform: string;
  os_version: string;
  device_model: string;
  app_version: string;
  user_id?: number;
  user?: {
    id: number;
    email?: string;
    username?: string;
  };
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
  notes?: string;
  is_fatal: boolean;
  crash_type: string;
};

export type CrashLogStats = {
  total: number;
  unresolved: number;
  fatal: number;
  by_platform: Record<string, number>;
  by_screen: Record<string, number>;
  by_crash_type: Record<string, number>;
  last_24_hours: number;
  last_7_days: number;
  last_30_days: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4000/api`
    : "http://192.168.100.15:4000/api");

function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookieEntry = document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  if (!cookieEntry) return undefined;
  const value = cookieEntry.split("=")[1];
  return value ? decodeURIComponent(value) : undefined;
}

function getAccessToken(): string | undefined {
  // Prefer localStorage first; stale cookies can otherwise override fresh tokens.
  if (typeof window !== "undefined") {
    const ls =
      window.localStorage?.getItem("accessToken") ||
      window.localStorage?.getItem("access_token") ||
      window.localStorage?.getItem("token");
    if (ls?.trim()) return ls.trim();
  }
  const cookieToken =
    getCookieValue("accessToken") ||
    getCookieValue("access_token") ||
    getCookieValue("token");
  if (cookieToken?.trim()) return cookieToken.trim();
  return undefined;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, any>,
): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : API_BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    cache: "no-store",
  });
  if (res.status === 401 && typeof window !== "undefined") {
    // Unauthenticated -> redirect to landing/login
    window.location.href = "/";
  }
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken?: string }> {
  const res = await fetch(`${API_BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await safeJson(res);
  if (!res.ok) {
    throw new Error(body?.message || `Login failed (${res.status})`);
  }
  const accessToken: string | undefined =
    body?.accessToken || body?.access_token;
  const refreshToken: string | undefined =
    body?.refreshToken || body?.refresh_token;
  if (!accessToken) throw new Error("No accessToken returned");
  return { accessToken, refreshToken };
}

export async function listAdminUsers(params: {
  page?: number;
  per_page?: number;
  role?: string;
  q?: string;
}): Promise<PaginatedResponse<AdminUser>> {
  return apiGet<PaginatedResponse<AdminUser>>("/admin/users", params);
}

export async function getAdminUser(id: number): Promise<{
  data: { user: AdminUser; verifications: any[]; recentAdminActions: any[] };
}> {
  return apiGet<{
    data: { user: AdminUser; verifications: any[]; recentAdminActions: any[] };
  }>(`/admin/users/${id}`);
}

export async function adminUpdateUser(
  id: number,
  body: { trueBroker?: boolean },
) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ true_broker: body.trueBroker }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminContactUser(
  userId: number,
  content: string,
): Promise<{ message_id?: number; receiver_id?: number }> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ content: content.trim() }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || err?.message || `Failed (${res.status})`);
  }
  return res.json();
}

export async function adminVerifyUser(
  id: number,
  body: { status: "pending" | "verified" | "rejected"; notes?: string },
) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export type AdminIdentityVerificationUser = {
  userId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarURL?: string;
  role?: string;
  verificationStatus?: string;
  isVerified?: boolean;
  idType?: string;
  idNumber?: string;
  idFrontImage?: string;
  idBackImage?: string;
  selfieImage?: string;
  brokerId?: string;
  brokerStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  historyCount?: number;
};

export type AdminIdentityVerificationRecord = {
  id: number;
  user_id: number;
  document_type: string;
  document_url: string;
  status: string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export async function listAdminIdentityVerifications(params: {
  page?: number;
  per_page?: number;
  q?: string;
  user_id?: string | number;
  status?: string;
}): Promise<PaginatedResponse<AdminIdentityVerificationUser>> {
  return apiGet<PaginatedResponse<AdminIdentityVerificationUser>>(
    "/admin/identity-verifications",
    params,
  );
}

export async function getAdminIdentityVerificationUser(
  userId: number,
): Promise<{
  data: {
    user: AdminIdentityVerificationUser;
    verifications: AdminIdentityVerificationRecord[];
  };
}> {
  return apiGet<{
    data: {
      user: AdminIdentityVerificationUser;
      verifications: AdminIdentityVerificationRecord[];
    };
  }>(`/admin/identity-verifications/${userId}`);
}

export async function listPendingBrokerVerifications(): Promise<{
  data: PendingBrokerVerification[];
  meta: { count: number };
}> {
  const res = await fetch(`${API_BASE}/admin/broker-verifications/pending`, {
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminReviewBrokerVerification(
  userId: number,
  body: { status: "approved" | "rejected"; notes?: string },
) {
  const res = await fetch(
    `${API_BASE}/admin/users/${userId}/broker-verification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAccessToken()
          ? { Authorization: `Bearer ${getAccessToken()}` }
          : {}),
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function listAdminProperties(params: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  host_id?: string;
  location?: string;
  created_from?: string;
  created_to?: string;
}): Promise<PaginatedResponse<AdminProperty>> {
  return apiGet<PaginatedResponse<AdminProperty>>("/admin/properties", params);
}

export async function getAdminProperty(
  id: number,
): Promise<{ data: AdminProperty; meta?: { host_stats?: AdminHostStats } }> {
  // No include param: host is always preloaded server-side (new binary),
  // images ship via the JSON column on every binary, and `include=media`
  // triggers a bogus Preload on old deployments that 404s a real property.
  return apiGet<{ data: AdminProperty; meta?: { host_stats?: AdminHostStats } }>(
    `/admin/properties/${id}`,
  );
}

export async function updatePropertyStatus(
  id: number,
  body: { status: string; note?: string },
) {
  const res = await fetch(`${API_BASE}/admin/properties/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function flagProperty(id: number, body: { reason: string }) {
  const res = await fetch(`${API_BASE}/admin/properties/${id}/flag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteAdminProperty(id: number) {
  const res = await fetch(`${API_BASE}/admin/properties/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function listAdminExperiences(params: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  host_id?: string;
  created_from?: string;
  created_to?: string;
}): Promise<PaginatedResponse<AdminExperience>> {
  return apiGet<PaginatedResponse<AdminExperience>>(
    "/admin/experiences",
    params,
  );
}

export async function getAdminExperience(
  id: number,
): Promise<{ data: AdminExperience }> {
  return apiGet<{ data: AdminExperience }>(`/admin/experiences/${id}`);
}

export async function updateExperienceStatus(
  id: number,
  body: { status: string; note?: string },
) {
  const res = await fetch(`${API_BASE}/admin/experiences/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function getAdminStats(): Promise<{ data: AdminStats }> {
  return apiGet<{ data: AdminStats }>("/admin/stats");
}

export async function getAdminModerationPending(since?: string): Promise<{
  data: ModerationPendingSummary;
}> {
  return apiGet<{ data: ModerationPendingSummary }>(
    "/admin/moderation/pending",
    since ? { since } : undefined,
  );
}

export function moderationPendingHref(
  kind: ModerationPendingKind,
  id: number,
): string {
  switch (kind) {
    case "rent":
      return `/dashboard/properties/${id}`;
    case "sale":
      return `/dashboard/property-sales`;
    case "land":
      return `/dashboard/landmarks`;
    default:
      return "/dashboard";
  }
}

export async function getAdminActivity(): Promise<{ data: any[] }> {
  return apiGet<{ data: any[] }>("/admin/activity");
}

export async function listAdminReservations(params: {
  page?: number;
  per_page?: number;
  status?: string;
  host_id?: string;
  guest_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedResponse<AdminReservation>> {
  return apiGet<PaginatedResponse<AdminReservation>>(
    "/admin/reservations",
    params,
  );
}

export async function cancelReservation(id: number, reason: string) {
  const res = await fetch(`${API_BASE}/admin/reservations/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function updateReservationStatus(id: number, status: string) {
  const res = await fetch(`${API_BASE}/admin/reservations/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function listAdminReviews(params: {
  page?: number;
  per_page?: number;
  property_id?: string;
  rating?: string;
}): Promise<PaginatedResponse<AdminReview>> {
  return apiGet<PaginatedResponse<AdminReview>>("/admin/reviews", params);
}

export async function updateReviewVisibility(
  id: number,
  visible: boolean,
  reason?: string,
) {
  const res = await fetch(`${API_BASE}/admin/reviews/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ visible, reason }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteReview(id: number) {
  const res = await fetch(`${API_BASE}/admin/reviews/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return true;
}

export async function listAdminFeedback(): Promise<{ data: AdminFeedback[] }> {
  return apiGet<{ data: AdminFeedback[] }>("/admin/feedback");
}

export type AdminAIEscalation = {
  id: number;
  session_id: string;
  user_id?: number | null;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  trigger_type?: string;
  reason?: string;
  urgency: string;
  status: string;
  context_summary?: string;
  created_at?: string;
  user?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
};

export async function listAdminAIEscalations(): Promise<{
  data: AdminAIEscalation[];
}> {
  return apiGet<{ data: AdminAIEscalation[] }>("/admin/ai/escalations");
}

export async function resolveAdminAIEscalation(
  id: number,
  notes: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/ai/escalations/${id}/resolve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ notes, status: "resolved" }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function listAdminAIInteractions(params?: {
  limit?: number;
}): Promise<{ data: AdminAIInteraction[] }> {
  return apiGet<{ data: AdminAIInteraction[] }>("/admin/ai/interactions", params);
}

export type ListingAIKindStats = {
  started_all_time: number;
  completed_all_time: number;
  failed_all_time: number;
  published_all_time: number;
  unique_users_30d: number;
  started_today: number;
  started_this_week: number;
  started_last_7_days: number;
  published_last_7_days: number;
};

export type ListingAIUsageSummary = {
  total_events_all_time: number;
  unique_users_all_time: number;
  started_today: number;
  started_this_week: number;
  started_previous_week: number;
  started_last_7_days: number;
  started_previous_7_days: number;
  started_last_30_days: number;
  completed_last_30_days: number;
  failed_last_30_days: number;
  published_last_30_days: number;
  published_all_time: number;
  unique_users_started_30d: number;
  unique_users_published_30d: number;
  by_kind: {
    rent: ListingAIKindStats;
    sale: ListingAIKindStats;
    land: ListingAIKindStats;
  };
};

export type ListingAIUsageDaily = {
  date: string;
  started: number;
  completed: number;
  failed: number;
  published: number;
  users: number;
  rent: number;
  sale: number;
  land: number;
};

export type ListingAIUsageWeekly = {
  week_start: string;
  started: number;
  completed: number;
  failed: number;
  published: number;
  users: number;
  rent: number;
  sale: number;
  land: number;
};

export type ListingAIUsageRecent = {
  id: number;
  created_at: string;
  user_id: number;
  kind: string;
  event: string;
  job_id?: string;
};

export type ListingAIUsageAnalytics = {
  summary: ListingAIUsageSummary;
  daily: ListingAIUsageDaily[];
  weekly: ListingAIUsageWeekly[];
  recent: ListingAIUsageRecent[];
};

export async function getAdminListingAIUsage(): Promise<{
  data: ListingAIUsageAnalytics;
}> {
  return apiGet<{ data: ListingAIUsageAnalytics }>("/admin/ai/listing-usage");
}

export type WhatsAppShareUsageSummary = {
  total_events_all_time: number;
  shares_completed_all_time: number;
  sheet_opened_all_time: number;
  share_started_all_time: number;
  share_failed_all_time: number;
  share_dismissed_all_time: number;
  sheet_opened_today: number;
  shares_completed_today: number;
  shares_completed_this_week: number;
  shares_completed_previous_week: number;
  shares_completed_last_7_days: number;
  shares_completed_previous_7_days: number;
  shares_completed_last_30_days: number;
  sheet_opened_last_30_days: number;
  share_started_last_30_days: number;
  share_failed_last_30_days: number;
  share_dismissed_last_30_days: number;
  completion_rate_last_30_days: number;
  unique_users_completed_30d: number;
  unique_listings_shared_30d: number;
};

export type WhatsAppShareUsageDaily = {
  date: string;
  opened: number;
  started: number;
  completed: number;
  failed: number;
  dismissed: number;
  users: number;
  listings: number;
};

export type WhatsAppShareUsagePlatform = {
  platform: string;
  completed: number;
};

export type WhatsAppShareUsageRecent = {
  id: number;
  created_at: string;
  user_id: number;
  property_sale_id: number;
  event: string;
  platform?: string;
  property_title?: string;
};

export type WhatsAppShareUsageAnalytics = {
  summary: WhatsAppShareUsageSummary;
  daily: WhatsAppShareUsageDaily[];
  by_platform: WhatsAppShareUsagePlatform[];
  recent: WhatsAppShareUsageRecent[];
};

export async function getAdminWhatsAppShareUsage(): Promise<{
  data: WhatsAppShareUsageAnalytics;
}> {
  return apiGet<{ data: WhatsAppShareUsageAnalytics }>(
    "/admin/whatsapp-share/usage",
  );
}

export async function getAdminWhatsAppShareBadge(): Promise<{
  data: { count: number };
}> {
  return apiGet<{ data: { count: number } }>("/admin/whatsapp-share/badge");
}

export async function getAdminMobileAIInsights(): Promise<{ data: AdminMobileAIInsights }> {
  return apiGet<{ data: AdminMobileAIInsights }>("/admin/insights/mobile-ai");
}

export async function getNewHomesNotificationAnalytics(): Promise<{
  data: NewHomesNotificationAnalytics;
}> {
  return apiGet<{ data: NewHomesNotificationAnalytics }>(
    "/admin/notifications/new-homes",
  );
}

export async function getNewHomesNotificationDeviceTiming(params?: {
  page?: number;
  per_page?: number;
  only_throttled?: boolean;
  user_id?: number;
  platform?: string;
}): Promise<NewHomesNotificationDeviceTimingResponse> {
  const q: Record<string, string> = {};
  if (params?.page) q.page = String(params.page);
  if (params?.per_page) q.per_page = String(params.per_page);
  if (typeof params?.only_throttled === "boolean") {
    q.only_throttled = params.only_throttled ? "1" : "0";
  }
  if (params?.user_id && params.user_id > 0) q.user_id = String(params.user_id);
  if (params?.platform) q.platform = params.platform;

  return apiGet<NewHomesNotificationDeviceTimingResponse>(
    "/admin/notifications/new-homes/devices",
    q,
  );
}

/** Admin-authored MeskenyGPT knowledge (retrieved into system prompt, char-capped). */
export type MeskenyKnowledgeEntry = {
  id: number;
  doc_type: string;
  locale: string;
  intent_scope: string;
  match_keywords: string;
  title: string;
  body: string;
  priority: number;
  active: boolean;
  created_by_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export async function listMeskenyKnowledge(params?: {
  active_only?: boolean;
}): Promise<{ data: MeskenyKnowledgeEntry[] }> {
  const q: Record<string, string> = {};
  if (params?.active_only) q.active_only = "1";
  return apiGet<{ data: MeskenyKnowledgeEntry[] }>("/admin/ai/knowledge", q);
}

export async function createMeskenyKnowledgeEntry(body: {
  doc_type: string;
  locale?: string;
  intent_scope?: string;
  match_keywords?: string;
  title: string;
  body: string;
  priority?: number;
  active?: boolean;
}): Promise<{ data: MeskenyKnowledgeEntry }> {
  const res = await fetch(`${API_BASE}/admin/ai/knowledge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Create failed (${res.status})`);
  }
  return res.json() as Promise<{ data: MeskenyKnowledgeEntry }>;
}

export async function updateMeskenyKnowledgeEntry(
  id: number,
  body: Partial<{
    doc_type: string;
    locale: string;
    intent_scope: string;
    match_keywords: string;
    title: string;
    body: string;
    priority: number;
    active: boolean;
  }>,
): Promise<{ data: MeskenyKnowledgeEntry }> {
  const res = await fetch(`${API_BASE}/admin/ai/knowledge/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Update failed (${res.status})`);
  }
  return res.json() as Promise<{ data: MeskenyKnowledgeEntry }>;
}

export async function deleteMeskenyKnowledgeEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/ai/knowledge/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Delete failed (${res.status})`);
  }
}

// Crash Logs API functions
export async function listAdminCrashLogs(params?: {
  page?: number;
  limit?: number;
  resolved?: string;
  platform?: string;
  screen?: string;
  search?: string;
}): Promise<{
  success: boolean;
  data: AdminCrashLog[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  return apiGet<{
    success: boolean;
    data: AdminCrashLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/crash-logs", params);
}

export async function getAdminCrashLog(id: number): Promise<{
  success: boolean;
  data: { crash_log: AdminCrashLog; context_parsed: Record<string, any> };
}> {
  return apiGet<{
    success: boolean;
    data: { crash_log: AdminCrashLog; context_parsed: Record<string, any> };
  }>(`/admin/crash-logs/${id}`);
}

export async function updateCrashLog(
  id: number,
  body: { is_resolved: boolean; notes?: string },
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/crash-logs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function getCrashLogStats(): Promise<{
  success: boolean;
  data: CrashLogStats;
}> {
  return apiGet<{ success: boolean; data: CrashLogStats }>(
    "/admin/crash-logs/stats",
  );
}

// Property Sales (Habitat Real Estate) moderation
export type AdminPropertySale = {
  id: number;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  property_type?: string;
  listing_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  area?: number;
  year_built?: number;
  images?: string[];
  videos?: string[];
  indoor_features?: string[];
  outdoor_features?: string[];
  amenity_ids?: number[];
  city_id?: number;
  zone_id?: number;
  quartier_id?: number;
  latitude?: number;
  longitude?: number;
  status?: string; // draft, verified, published, etc.
  is_verified?: boolean;
  is_published?: boolean;
  is_deactivated?: boolean;
  is_sold?: boolean;
  truckeck?: boolean; // quality control validated by admin
  is_investment_opportunity?: boolean;
  is_gold?: boolean;
  organization_id?: number | null;
  organization?: { id?: number; name?: string } | null;
};

export type AdminPropertySaleUpdate = Partial<{
  title: string;
  description: string;
  city: string;
  state: string;
  country: string;
  address: string;
  property_type: string;
  listing_price: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  area: number;
  year_built: number;
  images: string[];
  videos: string[];
  indoor_features: string[];
  outdoor_features: string[];
  amenity_ids: number[];
  city_id: number | null;
  zone_id: number | null;
  quartier_id: number | null;
  latitude: number;
  longitude: number;
  status: string;
  truckeck: boolean;
  is_investment_opportunity: boolean;
  is_gold: boolean;
}>;

export async function listAdminPropertySales(): Promise<{
  properties: AdminPropertySale[];
}> {
  return apiGet<{ properties: AdminPropertySale[] }>("/admin/property-sales");
}

export async function getAdminPropertySale(id: number): Promise<{
  property: AdminPropertySale;
}> {
  return apiGet<{ property: AdminPropertySale }>(`/admin/property-sales/${id}`);
}

export async function adminUpdatePropertySale(
  id: number,
  body: AdminPropertySaleUpdate,
) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function adminSetPropertySaleOrganization(
  id: number,
  organizationId: number | null,
) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}/organization`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ organization_id: organizationId }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export type AdminOrganization = {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  banner_image?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  license_number?: string;
  tax_id?: string;
  business_type?: string;
  status?: string;
  is_active?: boolean;
  owner_id?: number;
  owner?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  created_at?: string;
  updated_at?: string;
};

export async function listAdminOrganizations(): Promise<{
  organizations: AdminOrganization[];
}> {
  return apiGet<{ organizations: AdminOrganization[] }>("/admin/organizations");
}

export async function createAdminOrganization(body: {
  name: string;
  description?: string;
  logo?: string;
  banner_image?: string;
  website?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  license_number?: string;
  tax_id?: string;
  business_type?: string;
  owner_user_id?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/organizations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function updateAdminOrganization(
  id: number,
  body: {
    name?: string;
    description?: string;
    logo?: string;
    banner_image?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    license_number?: string;
    tax_id?: string;
    business_type?: string;
    owner_user_id?: number;
    status?: string;
    is_active?: boolean;
  },
): Promise<{ organization: AdminOrganization }> {
  const res = await fetch(`${API_BASE}/admin/organizations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function adminVerifyPropertySale(
  id: number,
  body: { is_verified: boolean; verification_notes?: string },
) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}/verify`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function publishPropertySale(id: number) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminDeactivatePropertySale(id: number) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}/deactivate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminReactivatePropertySale(id: number) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}/reactivate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminMarkPropertySaleAsSold(id: number) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}/sold`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminDeletePropertySale(id: number) {
  const res = await fetch(`${API_BASE}/admin/property-sales/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

// Landmark verification types and functions
export type AdminLandmarkCadastrePlot = {
  id: number;
  plot_number: string;
  area_m2?: number;
  sector_name?: string;
  plan_name?: string;
  plan_code?: string;
};

export type AdminLandmarkHost = {
  type: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
};

export type AdminLandmark = {
  id: number;
  title: string;
  description: string;
  area: number;
  area_unit: string;
  land_type: string;
  zoning: string;
  status: string;
  is_verified: boolean;
  is_published: boolean;
  is_investment_opportunity?: boolean;
  is_good_deal?: boolean;
  is_gold?: boolean;
  verified_at?: string;
  verified_by?: number;
  verification_notes?: string;
  images: string[];
  property_papers: string[];
  paper_types?: string[];
  video_url?: string;
  media_type?: string;
  price?: number;
  currency?: string;
  plot_number?: string;
  plot_confirmed?: boolean;
  habitat_plot_id?: number | null;
  cadastre_linked?: boolean;
  plot_number_matches_cadastre?: boolean;
  cadastre_plot?: AdminLandmarkCadastrePlot | null;
  city_id?: number | null;
  zone_id?: number | null;
  quartier_id?: number | null;
  city_name?: string;
  zone_name?: string;
  quartier_name?: string;
  district?: string;
  region?: string;
  elevation_m?: number;
  sides?: string[];
  lots?: number | null;
  host_private_note?: string;
  host?: AdminLandmarkHost;
  organization?: {
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
  } | null;
  organization_id?: number | null;
  owner_id?: number | null;
  created_at: string;
  updated_at: string;
  point1_lat?: number;
  point1_lng?: number;
  point2_lat?: number;
  point2_lng?: number;
  point3_lat?: number;
  point3_lng?: number;
  point4_lat?: number;
  point4_lng?: number;
};

export async function adminUpdateLandmark(
  id: number,
  body: Partial<{
    is_investment_opportunity: boolean;
    is_good_deal: boolean;
    is_gold: boolean;
  }>,
) {
  const res = await fetch(`${API_BASE}/admin/landmarks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export type AdminCountry = {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  name_fr?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminCity = {
  id: number;
  name: string;
  name_ar: string;
  country: string;
  country_ar: string;
  country_id?: number | null;
  countryRef?: AdminCountry;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zones?: AdminZone[];
};

export type AdminZone = {
  id: number;
  city_id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  city?: AdminCity;
  quartiers?: AdminQuartier[];
};

export type AdminQuartier = {
  id: number;
  zone_id: number;
  parent_quartier_id?: number;
  name: string;
  name_ar: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zone?: AdminZone;
  parent_quartier?: AdminQuartier;
  sub_quartiers?: AdminQuartier[];
};

export async function listAdminLandmarks(): Promise<{
  landmarks: AdminLandmark[];
}> {
  // Use the "all landmarks" endpoint to see everything
  const url = `${API_BASE}/admin/landmarks/`;
  console.log("Fetching landmarks from:", url);
  console.log("API_BASE:", API_BASE);
  console.log("Access token:", getAccessToken() ? "Present" : "Missing");

  const res = await fetch(url, {
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });

  console.log("Response status:", res.status);
  console.log("Response headers:", Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error response:", errorText);
    throw new Error(errorText || `Failed (${res.status})`);
  }

  const data = await res.json();
  console.log("Landmarks data:", data);
  return data;
}

export async function adminVerifyLandmark(
  id: number,
  body: { is_verified: boolean; verification_notes?: string },
) {
  const res = await fetch(`${API_BASE}/admin/landmarks/${id}/verify`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminUpdateLandmarkCoordinates(
  id: number,
  body: {
    point1_lat: number;
    point1_lng: number;
    point2_lat?: number;
    point2_lng?: number;
    point3_lat?: number;
    point3_lng?: number;
    point4_lat?: number;
    point4_lng?: number;
  },
) {
  const res = await fetch(`${API_BASE}/admin/landmarks/${id}/coordinates`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function adminSetLandmarkOrganization(
  id: number,
  organizationId: number | null,
) {
  const res = await fetch(`${API_BASE}/admin/landmarks/${id}/organization`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ organization_id: organizationId }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function adminDeleteLandmark(id: number) {
  const res = await fetch(`${API_BASE}/admin/landmarks/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

// Countries API (admin)
export async function listAdminCountries(): Promise<{ data: AdminCountry[] }> {
  return apiGet<{ data: AdminCountry[] }>("/admin/countries");
}

export async function createCountry(body: {
  code: string;
  name: string;
  name_ar: string;
  name_fr?: string;
  is_active?: boolean;
  sort_order?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/countries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function updateCountry(
  id: number,
  body: {
    code?: string;
    name?: string;
    name_ar?: string;
    name_fr?: string;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const res = await fetch(`${API_BASE}/admin/countries/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function deleteCountry(id: number) {
  const res = await fetch(`${API_BASE}/admin/countries/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return true;
}

// Cities and Zones API functions
export async function listAdminCities(): Promise<{ data: AdminCity[] }> {
  return apiGet<{ data: AdminCity[] }>("/admin/cities");
}

export async function createCity(body: {
  name: string;
  name_ar: string;
  country?: string;
  country_ar?: string;
  country_id?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/cities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function updateCity(
  id: number,
  body: {
    name?: string;
    name_ar?: string;
    country?: string;
    country_ar?: string;
    country_id?: number;
    is_active?: boolean;
  },
) {
  const res = await fetch(`${API_BASE}/admin/cities/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteCity(id: number) {
  const res = await fetch(`${API_BASE}/admin/cities/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return true;
}

export async function listAdminZones(): Promise<{ data: AdminZone[] }> {
  return apiGet<{ data: AdminZone[] }>("/admin/zones");
}

export async function createZone(body: {
  city_id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
}) {
  const res = await fetch(`${API_BASE}/admin/zones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function updateZone(
  id: number,
  body: {
    city_id?: number;
    name?: string;
    name_ar?: string;
    description?: string;
    description_ar?: string;
    is_active?: boolean;
  },
) {
  const res = await fetch(`${API_BASE}/admin/zones/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteZone(id: number) {
  const res = await fetch(`${API_BASE}/admin/zones/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return true;
}

// Quartiers API functions
export async function listAdminQuartiers(): Promise<{ data: AdminQuartier[] }> {
  return apiGet<{ data: AdminQuartier[] }>("/admin/quartiers");
}

export async function createQuartier(body: {
  zone_id: number;
  parent_quartier_id?: number;
  name: string;
  name_ar: string;
}) {
  const res = await fetch(`${API_BASE}/admin/quartiers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function updateQuartier(
  id: number,
  body: {
    zone_id?: number;
    parent_quartier_id?: number;
    name?: string;
    name_ar?: string;
    is_active?: boolean;
  },
) {
  const res = await fetch(`${API_BASE}/admin/quartiers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteQuartier(id: number) {
  const res = await fetch(`${API_BASE}/admin/quartiers/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return true;
}

export type LocationBulkImportResult = {
  cities_created: number;
  cities_skipped: number;
  zones_created: number;
  zones_skipped: number;
  quartiers_created: number;
  quartiers_skipped: number;
  errors: string[];
};

export async function getLocationBulkExample(): Promise<{
  data: Record<string, unknown>;
  schema: Record<string, unknown>;
}> {
  return apiGet<{ data: Record<string, unknown>; schema: Record<string, unknown> }>(
    "/admin/locations/bulk/example",
  );
}

export type HabitatPlanRow = {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  color?: string;
  sector_count: number;
  plot_count: number;
  total_area_m2: number;
  is_active: boolean;
};

export type HabitatBulkImportResult = {
  plans_created: number;
  plans_skipped: number;
  sectors_created: number;
  sectors_skipped: number;
  plots_created: number;
  plots_skipped: number;
  listings_zones_synced: number;
  listings_quartiers_synced: number;
  errors: string[];
};

export async function listHabitatPlans(): Promise<{
  success: boolean;
  data: HabitatPlanRow[];
}> {
  return apiGet<{ success: boolean; data: HabitatPlanRow[] }>("/habitat/plans");
}

export async function getHabitatBulkExample(): Promise<{
  data: Record<string, unknown>;
  mapping?: Record<string, unknown>;
}> {
  return apiGet<{ data: Record<string, unknown>; mapping?: Record<string, unknown> }>(
    "/admin/habitat/bulk/example",
  );
}

export async function bulkImportHabitat(
  body: Record<string, unknown>,
): Promise<{ success: boolean; data: HabitatBulkImportResult }> {
  const res = await fetch(`${API_BASE}/admin/habitat/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await safeJson(res);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Import failed (${res.status})`);
  }
  return json as { success: boolean; data: HabitatBulkImportResult };
}

export async function bulkImportLocations(
  body: Record<string, unknown>,
): Promise<{ success: boolean; data: LocationBulkImportResult }> {
  const res = await fetch(`${API_BASE}/admin/locations/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await safeJson(res);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Import failed (${res.status})`);
  }
  return json as { success: boolean; data: LocationBulkImportResult };
}

// Property Types (Categories) API functions - from categories table
export type AdminCategory = {
  id: number;
  type: "property" | "experience";
  name: { en: string; fr: string; ar: string };
  icon: string;
  description: { en: string; fr: string; ar: string };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listAdminCategories(params?: {
  type?: "property" | "experience";
}): Promise<{ success: boolean; data: AdminCategory[]; count: number }> {
  return apiGet<{ success: boolean; data: AdminCategory[]; count: number }>(
    "/admin/categories",
    params,
  );
}

export async function createCategory(body: {
  type: "property" | "experience";
  name_en: string;
  name_fr?: string;
  name_ar?: string;
  icon: string;
  description_en?: string;
  description_fr?: string;
  description_ar?: string;
  sort_order?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function updateCategory(
  id: number,
  body: {
    name_en?: string;
    name_fr?: string;
    name_ar?: string;
    icon?: string;
    description_en?: string;
    description_fr?: string;
    description_ar?: string;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteCategory(id: number, hard?: boolean) {
  const url = hard
    ? `${API_BASE}/admin/categories/${id}?hard=true`
    : `${API_BASE}/admin/categories/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function seedPropertyCategories() {
  const res = await fetch(`${API_BASE}/admin/categories/seed-property`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

// Amenities (property amenities) API functions - from amenities table
export type AdminAmenity = {
  id: number;
  name: { en: string; fr: string; ar: string };
  icon: string;
  category: string;
  description: { en: string; fr: string; ar: string };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listAdminAmenities(params?: {
  category?: string;
}): Promise<{ success: boolean; data: AdminAmenity[]; count: number }> {
  return apiGet<{ success: boolean; data: AdminAmenity[]; count: number }>(
    "/admin/amenities",
    params,
  );
}

export async function createAmenity(body: {
  name_en: string;
  name_fr?: string;
  name_ar?: string;
  icon: string;
  category: string;
  description_en?: string;
  description_fr?: string;
  description_ar?: string;
  sort_order?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/amenities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function updateAmenity(
  id: number,
  body: {
    name_en?: string;
    name_fr?: string;
    name_ar?: string;
    icon?: string;
    category?: string;
    description_en?: string;
    description_fr?: string;
    description_ar?: string;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const res = await fetch(`${API_BASE}/admin/amenities/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function deleteAmenity(id: number, hard?: boolean) {
  const url = hard
    ? `${API_BASE}/admin/amenities/${id}?hard=true`
    : `${API_BASE}/admin/amenities/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

export async function seedAmenities() {
  const res = await fetch(`${API_BASE}/admin/amenities/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

/** User-uploaded rent listing videos (moderation queue + full list) */
export type AdminVideo = {
  ID: number;
  userID: number;
  propertyID?: number | null;
  videoURL: string;
  thumbnailURL?: string;
  caption?: string;
  durationSec?: number;
  status: string;
  isFlagged?: boolean;
  isPromotional?: boolean;
  likesCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<AdminUser, "ID" | "firstName" | "lastName" | "email" | "avatarURL">;
  property?: Pick<AdminProperty, "ID" | "title" | "city">;
};

export async function listAdminVideos(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  is_flagged?: string;
  /** "true" | "false" — omit for all */
  is_promotional?: string;
  sort?: string;
}): Promise<PaginatedResponse<AdminVideo>> {
  return apiGet<PaginatedResponse<AdminVideo>>("/admin/videos", params);
}

export async function updateAdminVideoStatus(
  id: number,
  status: "approved" | "rejected" | "pending",
) {
  const res = await fetch(`${API_BASE}/admin/videos/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.message || `Failed (${res.status})`);
  return res.json();
}

// Promotional Videos API functions
export type AdminPromotionalVideo = {
  ID: number;
  videoURL: string;
  thumbnailURL?: string;
  title: string;
  description?: string;
  caption?: string;
  durationSec?: number;
  isPromotional: boolean;
  status: string;
  userID: number;
  propertyID?: number | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<AdminUser, "ID" | "firstName" | "lastName" | "avatarURL">;
  property?: Pick<AdminProperty, "ID" | "title">;
};

/** Normalize admin video rows (Go/gorm often emits PascalCase on embedded Model). */
export function normalizeAdminPromotionalVideo(
  raw: Record<string, unknown>,
): AdminPromotionalVideo {
  const pickStr = (...keys: string[]): string => {
    for (const k of keys) {
      const v = raw[k];
      if (v != null && String(v).trim() !== "") return String(v);
    }
    return "";
  };
  const pickNum = (...keys: string[]): number => {
    for (const k of keys) {
      const v = raw[k];
      if (v == null) continue;
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return 0;
  };
  const pickBool = (...keys: string[]): boolean => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "boolean") return v;
      if (v === 1 || v === "1" || v === "true") return true;
    }
    return false;
  };
  const id = pickNum("ID", "id");
  const userID = pickNum("userID", "user_id", "UserID");
  const propertyIDRaw = raw.propertyID ?? raw.property_id ?? raw.PropertyID;
  const propertyID =
    propertyIDRaw == null
      ? null
      : Number(propertyIDRaw) > 0
        ? Number(propertyIDRaw)
        : null;
  return {
    ID: id,
    videoURL: pickStr("videoURL", "video_url", "VideoURL"),
    thumbnailURL:
      pickStr("thumbnailURL", "thumbnail_url", "ThumbnailURL") || undefined,
    title: pickStr("title", "Title"),
    description: pickStr("description", "Description") || undefined,
    caption: pickStr("caption", "Caption") || undefined,
    durationSec: (() => {
      const d = pickNum("durationSec", "duration_sec", "DurationSec");
      return d > 0 ? d : undefined;
    })(),
    isPromotional: pickBool("isPromotional", "is_promotional", "IsPromotional"),
    status: pickStr("status", "Status") || "approved",
    userID,
    propertyID,
    createdAt: pickStr("createdAt", "CreatedAt", "created_at"),
    updatedAt: pickStr("updatedAt", "UpdatedAt", "updated_at"),
    user: (raw.user ?? raw.User) as AdminPromotionalVideo["user"],
    property: (raw.property ?? raw.Property) as AdminPromotionalVideo["property"],
  };
}

export async function listAdminPromotionalVideos(params?: {
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<AdminPromotionalVideo>> {
  const page = await apiGet<PaginatedResponse<Record<string, unknown>>>(
    "/admin/videos/promotional",
    params,
  );
  return {
    ...page,
    data: (page.data || []).map(normalizeAdminPromotionalVideo),
  };
}

export async function createPromotionalVideo(body: {
  videoURL: string;
  thumbnailURL?: string;
  title: string;
  description?: string;
  caption?: string;
  durationSec?: number;
  propertyID?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/videos/promotional`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await safeJson(res);
    const msg = [body?.message, body?.error].filter(Boolean).join(": ");
    throw new Error(msg || `Failed (${res.status})`);
  }
  return res.json();
}

export async function updatePromotionalVideo(
  id: number,
  body: {
    videoURL?: string;
    thumbnailURL?: string;
    title?: string;
    description?: string;
    caption?: string;
    status?: string;
  },
) {
  const res = await fetch(`${API_BASE}/admin/videos/promotional/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await safeJson(res);
    const msg = [body?.message, body?.error].filter(Boolean).join(": ");
    throw new Error(msg || `Failed (${res.status})`);
  }
  return res.json();
}

export async function deletePromotionalVideo(id: number) {
  const res = await fetch(`${API_BASE}/admin/videos/promotional/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204) {
    const body = await safeJson(res);
    const msg = [body?.message, body?.error].filter(Boolean).join(": ");
    throw new Error(msg || `Failed (${res.status})`);
  }
  return true;
}

// Banners API (property sale feed promotional banners)
export type AdminBanner = {
  id: number;
  image_url: string;
  link_url: string;
  width: number;
  height: number;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function listAdminBanners(): Promise<AdminBanner[]> {
  const res = await apiGet<{ banners: AdminBanner[] }>("/admin/banners");
  return res.banners || [];
}

export async function createBanner(body: {
  image_url: string;
  link_url?: string;
  width?: number;
  height?: number;
  sort_order?: number;
}): Promise<AdminBanner> {
  const res = await fetch(`${API_BASE}/admin/banners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function updateBanner(
  id: number,
  body: Partial<{
    image_url: string;
    link_url: string;
    width: number;
    height: number;
    sort_order: number;
    is_active: boolean;
  }>,
): Promise<AdminBanner> {
  const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
  return res.json();
}

export async function deleteBanner(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/banners/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204)
    throw new Error((await safeJson(res))?.error || `Failed (${res.status})`);
}

// Music library (listing slideshow videos)
export type MusicTrack = {
  ID?: number;
  id?: number;
  title: string;
  category: string;
  file_url: string;
  duration_sec?: number;
  is_active: boolean;
  sort_order: number;
  notes?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  created_at?: string;
  updated_at?: string;
};

export function musicTrackId(track: MusicTrack): number {
  return track.ID ?? track.id ?? 0;
}

export async function listAdminMusicTracks(): Promise<MusicTrack[]> {
  const res = await apiGet<{ data: MusicTrack[] }>("/admin/music-tracks");
  return res.data || [];
}

export async function createMusicTrack(body: {
  title: string;
  category?: string;
  file_url: string;
  duration_sec?: number;
  is_active?: boolean;
  sort_order?: number;
  notes?: string;
}): Promise<MusicTrack> {
  const res = await fetch(`${API_BASE}/admin/music-tracks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await safeJson(res);
    throw new Error(j?.error || j?.message || `Failed (${res.status})`);
  }
  const data = await res.json();
  return data.data;
}

export async function updateMusicTrack(
  id: number,
  body: Partial<{
    title: string;
    category: string;
    file_url: string;
    duration_sec: number;
    is_active: boolean;
    sort_order: number;
    notes: string;
  }>,
): Promise<MusicTrack> {
  const res = await fetch(`${API_BASE}/admin/music-tracks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await safeJson(res);
    throw new Error(j?.error || j?.message || `Failed (${res.status})`);
  }
  const data = await res.json();
  return data.data;
}

export async function deleteMusicTrack(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/music-tracks/${id}`, {
    method: "DELETE",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
  });
  if (!res.ok && res.status !== 204) {
    const j = await safeJson(res);
    throw new Error(j?.error || j?.message || `Failed (${res.status})`);
  }
}

export async function uploadAdminMusicFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("audio", file);
  const res = await fetch(`${API_BASE}/admin/music-tracks/upload`, {
    method: "POST",
    headers: {
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: form,
  });
  if (!res.ok) {
    const j = await safeJson(res);
    throw new Error(j?.error || j?.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("Upload succeeded but no URL returned");
  return data.url;
}

// Upload functions
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

        const res = await fetch(`${API_BASE}/upload/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAccessToken()
              ? { Authorization: `Bearer ${getAccessToken()}` }
              : {}),
          },
          body: JSON.stringify({ data: base64Data }),
        });

        if (!res.ok)
          throw new Error(
            (await safeJson(res))?.message || `Upload failed (${res.status})`,
          );
        const data = await res.json();
        resolve(data.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadVideo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

        const res = await fetch(`${API_BASE}/upload/video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAccessToken()
              ? { Authorization: `Bearer ${getAccessToken()}` }
              : {}),
          },
          body: JSON.stringify({
            data: base64Data,
            mime: file.type || "video/mp4",
          }),
        });

        if (!res.ok)
          throw new Error(
            (await safeJson(res))?.message || `Upload failed (${res.status})`,
          );
        const data = await res.json();
        resolve(data.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Device Analytics API functions
export type DeviceAnalytics = {
  totalDevices: number;
  activeDevices: number;
  todayUniqueDevices?: number;
  todayOpenedDevices?: Array<{
    deviceId: string;
    deviceModel: string;
    platform: string;
    appVersion: string;
    lastSeenAt: number;
  }>;
  todayDate?: string;
  generatedAt?: string;
  platformStats: Array<{
    platform: string;
    count: number;
    percentage: number;
  }>;
  deviceModelStats: Array<{
    deviceModel: string;
    count: number;
    platform: string;
  }>;
  timeSeriesData: Array<{
    date: string;
    count: number;
  }>;
  usageStats: {
    totalSessions: number;
    totalUsageSeconds: number;
    averageSessionSec: number;
    totalUsageHours: number;
    dailyAverageSec: number;
    dailyAverageHours: number;
  };
  usageTimeSeries: Array<{
    date: string;
    totalSessions: number;
    totalUsageSec: number;
    totalUsageHours: number;
    averageSessionSec: number;
  }>;
};

export async function getDeviceAnalytics(): Promise<{
  analytics: DeviceAnalytics;
}> {
  return apiGet<{ analytics: DeviceAnalytics }>("/device/analytics");
}

// Device Daily Usage API types and functions
export type DeviceDailyUsage = {
  deviceId: string;
  deviceModel: string;
  platform: string;
  date: string;
  visitCount: number;
  usageSeconds: number;
  usageMinutes: number;
  usageHours: number;
  sessionCount: number;
};

export type DeviceSummary = {
  deviceId: string;
  deviceModel: string;
  platform: string;
  totalVisits: number;
  totalUsageSec: number;
  totalUsageHours: number;
  daysActive: number;
  averageDailySec: number;
  averageDailyHours: number;
  firstSeen: string;
  lastSeen: string;
};

export type DeviceDailyUsageData = {
  totalUniqueDevices: number;
  dailyUsage: DeviceDailyUsage[];
  deviceSummaries: DeviceSummary[];
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
};

export async function getDeviceDailyUsage(
  days?: number,
): Promise<{ success: boolean; data: DeviceDailyUsageData }> {
  return apiGet<{ success: boolean; data: DeviceDailyUsageData }>(
    "/device/daily-usage",
    days ? { days } : undefined,
  );
}

export type ListingEmailTestKind = "property_sale" | "rent" | "land";

export async function sendAdminListingTestEmail(body: {
  to?: string;
  listing_kind: ListingEmailTestKind;
  listing_id: number;
}): Promise<{
  ok: boolean;
  to: string;
  listing: { kind: string; id: number; title: string };
}> {
  const res = await fetch(`${API_BASE}/admin/email/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Send failed (${res.status})`);
  }
  return data;
}
