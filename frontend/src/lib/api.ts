// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token if present
api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGE4YmUyNDU0NGQyNDFlMzMzMWM4OSIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJtb2JpbGVOdW1iZXIiOiI5OTk5OTk5OTk5Iiwicm9sZXMiOm51bGwsImlhdCI6MTc2NzA3MzI4NSwiZXhwIjoxNzY3Njc4MDg1fQ.hjRs8dhL_aC-z8WGj0WUZ1VvG8SToGOy0yUoswKRjqA";
  if (token && config?.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
