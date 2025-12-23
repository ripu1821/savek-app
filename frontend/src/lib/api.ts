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
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2FiNDRiNzdhYmMwYzU5NTk5YWRhZiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJtb2JpbGVOdW1iZXIiOiI5OTk5OTk5OTk5Iiwicm9sZXMiOm51bGwsImlhdCI6MTc2NjQ2NzA0NiwiZXhwIjoxNzY3MDcxODQ2fQ.mGHdFbXh_zkCa053ctVmKb2rcdrrr7EZvEDM9YaV4js";
  if (token && config?.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
