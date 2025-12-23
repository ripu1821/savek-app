// src/hooks/useFetchDashboardData.ts
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";

type AnyArray = any[];

function extractItems(resp: any): AnyArray {
  // expected server shape:
  // { status, message, payload: { items: [...] } }
  // OR older shape: { data: { items: [...] } }

  const payload = resp?.data?.payload;
  const data = resp?.data?.data;

  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(data?.items)) return data.items;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(data)) return data;

  if (Array.isArray(resp?.data)) return resp.data;

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

  // 🔥 NEW – Top attendance ranking
  const [userAttendanceRank, setUserAttendanceRank] = useState<AnyArray>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    cancelledRef.current = false;

    try {
      const [amResp, uResp, rResp, lResp, pResp, aulResp, attendanceResp] =
        await Promise.all([
          api.get("/amavasya"),
          api.get("/user"),
          api.get("/role"),
          api.get("/location"),
          api.get("/permission"),
          api.get("/amavasyaUserLocation"),
          api.get("/amavasyaUserLocation/dashboard/userAttendanceCount"),
        ]);

      if (cancelledRef.current) return;

      setAmavasya(extractItems(amResp));
      setUsers(extractItems(uResp));
      setRoles(extractItems(rResp));
      setLocations(extractItems(lResp));
      setPermissions(extractItems(pResp));
      setAmavasyaUserLocations(extractItems(aulResp));
      setUserAttendanceRank(extractItems(attendanceResp));
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      const serverMsg = err?.response?.data?.message ?? err?.message;
      setError(serverMsg ?? "Failed to load dashboard data");
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
    fetchAll();
  }, [fetchAll]);

  return {
    amavasya,
    users,
    roles,
    locations,
    permissions,
    amavasyaUserLocations,

    // 🔥 NEW EXPORT
    userAttendanceRank,

    loading,
    error,
    refetch,
  };
}
