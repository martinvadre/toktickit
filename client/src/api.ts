export interface Category {
  id: number;
  name: string;
}

export interface CheckSystemResult {
  status: "Online" | "Offline";
  categories: Category[];
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

    const categories: Category[] = await categoriesRes.json();
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
