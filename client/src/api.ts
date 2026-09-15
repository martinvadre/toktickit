export type UserRole = "REQUESTER" | "STAFF" | "ADMIN";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  department?: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem("toktickit_auth_token");
  }
  return null;
}

export function setAuthToken(token: string | null) {
  if (typeof window !== "undefined" && window.localStorage) {
    if (token) {
      window.localStorage.setItem("toktickit_auth_token", token);
    } else {
      window.localStorage.removeItem("toktickit_auth_token");
    }
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department?: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface RelatedSystem {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface Attachment {
  id: number;
  ticketId: number;
  fileName: string;
  storedFileName?: string;
  fileSize: number;
  mimeType: string;
  isRemoved: boolean;
  removalReason?: string | null;
  removedAt?: string | null;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: number;
    name: string;
    email?: string;
    role: UserRole;
  };
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  assignedStaffId?: number | null;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  itPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  currentStatus: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_REQUESTER" | "RESOLVED" | "CLOSED" | "CANCELLED";
  requesterIndicatedResolved?: boolean;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: RequesterUser;
  assignedStaff?: StaffMember | null;
  attachments?: Attachment[];
  attachmentCount?: number;
  comments?: TicketComment[];
}

export interface CreateTicketPayload {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface PaginationMetadata {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  requesterId: number;
  summary: string;
  description?: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  currentStatus: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_REQUESTER" | "RESOLVED" | "CLOSED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  attachmentCount?: number;
}

export interface GetTicketsParams {
  requesterId: number;
  search?: string;
  categoryId?: number;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetTicketsResponse {
  data: TicketListItem[];
  pagination: PaginationMetadata;
}

export interface CheckSystemResult {
  status: "Online" | "Offline";
  categories: Category[];
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchRequesters(): Promise<RequesterUser[]> {
  const response = await fetch(`${API_URL}/api/requesters`);
  if (!response.ok) {
    throw new Error("Failed to fetch development requesters");
  }
  const result = await response.json();
  return result.data || result;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const result = await response.json();
  return result.data || result;
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const response = await fetch(`${API_URL}/api/related-systems`);
  if (!response.ok) {
    throw new Error("Failed to fetch related systems");
  }
  const result = await response.json();
  return result.data || result;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(payload.requesterId),
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMsg = result.error?.message || "Failed to create ticket";
    const fieldErrors = result.error?.fieldErrors;
    const error: any = new Error(errorMsg);
    error.fieldErrors = fieldErrors;
    throw error;
  }

  return result.data;
}

export async function fetchMyTickets(params: GetTicketsParams): Promise<GetTicketsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const response = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers: {
      "x-requester-id": String(params.requesterId),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return response.json();
}

export async function fetchTicketDetail(ticketId: number, requesterId: number): Promise<Ticket> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  const result = await response.json();

  if (!response.ok) {
    const error: any = new Error(result.error?.message || "Failed to fetch ticket detail");
    error.code = result.error?.code;
    error.status = response.status;
    throw error;
  }

  return result.data;
}

export async function uploadAttachment(
  ticketId: number,
  file: File,
  requesterId: number
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "x-requester-id": String(requesterId),
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to upload attachment");
  }

  return result.data;
}

export async function downloadAttachment(
  attachmentId: number,
  requesterId: number,
  fileName: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
    headers: {
      "x-requester-id": String(requesterId),
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error?.message || "Failed to download attachment");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function removeAttachment(
  attachmentId: number,
  reason: string,
  requesterId: number
): Promise<Attachment> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": String(requesterId),
    },
    body: JSON.stringify({ reason }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to remove attachment");
  }

  return result.data;
}

export async function checkSystem(): Promise<CheckSystemResult> {
  try {
    const healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok) {
      return {
        status: "Offline",
        categories: [],
        error: "Unable to connect to TokTickIT API",
      };
    }

    const categoriesRes = await fetch(`${API_URL}/api/categories`);
    if (!categoriesRes.ok) {
      return {
        status: "Offline",
        categories: [],
        error: "Unable to fetch request categories",
      };
    }

    const resJson = await categoriesRes.json();
    const categories: Category[] = resJson.data || resJson;
    return {
      status: "Online",
      categories,
    };
  } catch (err) {
    return {
      status: "Offline",
      categories: [],
      error: "Unable to connect to TokTickIT API",
    };
  }
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to log in");
  }
  setAuthToken(result.data.token);
  return result.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } finally {
    setAuthToken(null);
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to fetch current user");
  }
  return result.data;
}

export async function changeUserPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string; user: AuthUser }> {
  const response = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to change password");
  }
  return result.data;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface StaffTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  itPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  currentStatus: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_REQUESTER" | "RESOLVED" | "CLOSED" | "CANCELLED";
  requesterIndicatedResolved?: boolean;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester: RequesterUser;
  assignedStaff?: StaffMember | null;
  category: Category;
  relatedSystem: RelatedSystem;
  attachments?: Attachment[];
  attachmentCount: number;
  comments?: TicketComment[];
  commentCount: number;
}

export interface StaffTicketsParams {
  search?: string;
  status?: string;
  categoryId?: number | string;
  relatedSystemId?: number | string;
  assignedStaffId?: number | string;
  requestedPriority?: string;
  itPriority?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StaffTicketsResponse {
  data: StaffTicket[];
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  counts: {
    total: number;
    unassigned: number;
    inProgress: number;
    resolved: number;
  };
}

export async function fetchStaffTickets(
  params: StaffTicketsParams = {}
): Promise<StaffTicketsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.categoryId && params.categoryId !== "ALL") query.set("categoryId", String(params.categoryId));
  if (params.relatedSystemId && params.relatedSystemId !== "ALL") query.set("relatedSystemId", String(params.relatedSystemId));
  if (params.assignedStaffId && params.assignedStaffId !== "ALL") query.set("assignedStaffId", String(params.assignedStaffId));
  if (params.requestedPriority && params.requestedPriority !== "ALL") query.set("requestedPriority", params.requestedPriority);
  if (params.itPriority && params.itPriority !== "ALL") query.set("itPriority", params.itPriority);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const qs = query.toString();
  const url = `${API_URL}/api/staff/tickets${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to fetch staff tickets");
  }
  return result;
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const response = await fetch(`${API_URL}/api/staff/members`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to fetch staff members");
  }
  return result.data;
}

export async function fetchStaffTicketDetail(ticketId: number): Promise<StaffTicket> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to fetch ticket detail");
  }
  return result.data;
}

export async function updateStaffTicketStatus(
  ticketId: number,
  status: string,
  resolutionSummary?: string
): Promise<StaffTicket> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status, resolutionSummary }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to update ticket status");
  }
  return result.data;
}

export async function assignTicketStaff(
  ticketId: number,
  assignedStaffId: number | null
): Promise<StaffTicket> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ assignedStaffId }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to assign staff");
  }
  return result.data;
}

export async function updateTicketPriority(
  ticketId: number,
  itPriority: string
): Promise<StaffTicket> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ itPriority }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to update IT priority");
  }
  return result.data;
}

export async function addStaffComment(
  ticketId: number,
  content: string,
  isInternal: boolean = false
): Promise<TicketComment> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ content, isInternal }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to add comment");
  }
  return result.data;
}

export async function addRequesterComment(
  ticketId: number,
  content: string
): Promise<TicketComment> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ content }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to add comment");
  }
  return result.data;
}

export async function indicateTicketResolved(
  ticketId: number
): Promise<{ id: number; ticketNumber: string; requesterIndicatedResolved: boolean }> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/indicate-resolved`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to indicate resolution");
  }
  return result.data;
}


