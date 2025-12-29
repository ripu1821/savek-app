import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";

type AnyArray = any[];

/* =========================
   HELPERS
========================= */
function extractItems(resp: any): AnyArray {
  const payload = resp?.data?.payload;
  const data = resp?.data?.data;

  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(data?.items)) return data.items;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(data)) return data;

  if (Array.isArray(resp?.data)) return resp.data;

  return [];
}

/* =========================
   HOOK
========================= */
export default function useFetchDashboardData() {
  // 🔹 LIST DATA (unchanged)
  const [amavasya, setAmavasya] = useState<AnyArray>([]);
  const [users, setUsers] = useState<AnyArray>([]);
  const [roles, setRoles] = useState<AnyArray>([]);
  const [locations, setLocations] = useState<AnyArray>([]);
  const [permissions, setPermissions] = useState<AnyArray>([]);
  const [amavasyaUserLocations, setAmavasyaUserLocations] = useState<AnyArray>(
    []
  );

  // 🔹 COUNT DATA (🔥 IMPORTANT – NEW)
  const [counts, setCounts] = useState({
    users: 0,
    roles: 0,
    locations: 0,
    permissions: 0,
    amavasya: 0,
    amavasyaUserLocations: 0,
  });

  // 🔹 Attendance leaderboard
  const [userAttendanceRank, setUserAttendanceRank] = useState<AnyArray>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  /* =========================
     FETCH ALL DASHBOARD DATA
  ========================= */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    cancelledRef.current = false;

    try {
      const [
        amResp,
        uResp,
        rResp,
        lResp,
        pResp,
        aulResp,
        attendanceResp,
        countsResp, // ✅ COUNT API RESPONSE
      ] = await Promise.all([
        api.get("/dashboard/amavasya"),
        api.get("/user"),
        api.get("/role"),
        api.get("/location"),
        api.get("/permission"),
        api.get("/amavasyaUserLocation"),
        api.get("/dashboard/userAttendance"),
        api.get("/dashboard/counts"), // 🔥 COUNT API
      ]);

      if (cancelledRef.current) return;

      // lists (same as before)
      setAmavasya(extractItems(amResp));
      setUsers(extractItems(uResp));
      setRoles(extractItems(rResp));
      setLocations(extractItems(lResp));
      setPermissions(extractItems(pResp));
      setAmavasyaUserLocations(extractItems(aulResp));

      // leaderboard
      setUserAttendanceRank(extractItems(attendanceResp));

      // 🔥 SET COUNTS (THIS WAS MISSING)
      setCounts(countsResp?.data.data ?? {});
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      const serverMsg = err?.response?.data?.message ?? err?.message;
      setError(serverMsg ?? "Failed to load dashboard data");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchAll]);

  const refetch = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  /* =========================
     EXPORT
  ========================= */
  return {
    // lists
    amavasya,
    users,
    roles,
    locations,
    permissions,
    amavasyaUserLocations,

    // 🔥 COUNTS (NEW & REQUIRED)
    counts,

    // leaderboard
    userAttendanceRank,

    loading,
    error,
    refetch,
  };
}
