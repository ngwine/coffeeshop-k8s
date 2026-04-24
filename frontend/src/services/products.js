// services/products.js
import { api } from "../lib/api";

export async function getProducts({
  page = 1,
  limit = 12,
  category,
  q,
  sort,
} = {}) {
  const params = { page, limit };
  if (category && category !== "all") params.category = category;
  if (q) params.q = q;
  if (sort) params.sort = sort;

  // ⭐ GIỮ /api/products
  const { data } = await api.get("/api/products", { params });

  // Nếu BE trả { items: [...], total, page, pages }
  if (Array.isArray(data.items)) return data.items;

  // Nếu BE trả thẳng là array
  if (Array.isArray(data)) return data;

  // Nếu BE bọc kiểu { data: [...] }
  if (Array.isArray(data.data)) return data.data;

  return [];
}

export async function getProduct(id) {
  const { data } = await api.get(`/api/products/${id}`);
  return data.data || data; // tuỳ backend
}
