// src/hooks/useFetchDashboardData.ts
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";

type AnyArray = any[];

function extractItems(resp: any): AnyArray {
  // resp is axios response
  // expected server shape: { success, status, message, data: { items: [...], ... } }
  // fallback shapes are handled defensively
  const d = resp?.data?.data;

  if (!d) {
    // maybe server returned array directly in resp.data (older shape)
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }

  if (Array.isArray(d)) return d; // server returned data: [ ... ] directly
  if (Array.isArray(d.items)) return d.items; // paginated shape
  if (Array.isArray(d.data)) return d.data; // nested fallback
  // possibly a single object — not an array
  return [];
}

export default function useFetchDashboardData() {
  const [amavasya, setAmavasya] = useState<AnyArray>([]);
  const [users, setUsers] = useState<AnyArray>([]);
  const [roles, setRoles] = useState<AnyArray>([]);
  const [locations, setLocations] = useState<AnyArray>([]);
  const [permissions, setPermissions] = useState<AnyArray>([]);
  const [amavasyaUserLocations, setAmavasyaUserLocations] = useState<AnyArray>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ref so refetch has stable identity and uses latest function
  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    cancelledRef.current = false;

    try {
      const [amResp, uResp, rResp, lResp, pResp, aulResp] = await Promise.all([
        api.get("/amavasya"),
        api.get("/user"),
        api.get("/role"),
        api.get("/location"),
        api.get("/permission"),
        api.get("/amavasyaUserLocation"),
      ]);

      if (cancelledRef.current) return;

      const amItems = extractItems(amResp);
      const uItems = extractItems(uResp);
      const rItems = extractItems(rResp);
      const lItems = extractItems(lResp);
      const pItems = extractItems(pResp);
      const aulItems = extractItems(aulResp);
      
      setAmavasya(amItems);
      setUsers(uItems);
      setRoles(rItems);
      setLocations(lItems);
      setPermissions(pItems);
      setAmavasyaUserLocations(aulItems);
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      // prefer server message if present
      const serverMsg = err?.response?.data?.message ?? err?.message;
      setError(serverMsg ?? "Failed to load data");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    fetchAll();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchAll]);

  const refetch = useCallback(() => {
    // call fetchAll again without reloading page
    fetchAll();
  }, [fetchAll]);

  return {
    amavasya,
    users,
    roles,
    locations,
    permissions,
    amavasyaUserLocations,
    loading,
    error,
    refetch,
  };
}
