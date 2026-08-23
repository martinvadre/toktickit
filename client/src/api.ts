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
