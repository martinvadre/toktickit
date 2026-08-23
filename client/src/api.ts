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

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  currentStatus: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_REQUESTER" | "RESOLVED" | "CLOSED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: RequesterUser;
  attachmentCount?: number;
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
