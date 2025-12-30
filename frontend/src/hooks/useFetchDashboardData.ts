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
  // lists
  const [amavasya, setAmavasya] = useState<AnyArray>([]);
  const [users, setUsers] = useState<AnyArray>([]);
  const [roles, setRoles] = useState<AnyArray>([]);
  const [locations, setLocations] = useState<AnyArray>([]);
  const [permissions, setPermissions] = useState<AnyArray>([]);
  const [amavasyaUserLocations, setAmavasyaUserLocations] = useState<AnyArray>(
    []
  );

  // counts
  const [counts, setCounts] = useState({
    users: 0,
    roles: 0,
    locations: 0,
    permissions: 0,
    amavasya: 0,
    amavasyaUserLocations: 0,
  });

  // leaderboard
  const [userAttendanceRank, setUserAttendanceRank] = useState<AnyArray>([]);

  // 🔍 SEARCH STATE
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  /* =========================
     FETCH ALL
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
        countsResp,
      ] = await Promise.all([
        api.get("/dashboard/amavasya"),
        api.get("/user"),
        api.get("/role"),
        api.get("/location"),
        api.get("/permission"),
        api.get("/amavasyaUserLocation"),
        api.get("/dashboard/userAttendance", {
          params: {
            search: attendanceSearch || undefined, // 🔥 SEARCH PARAM
          },
        }),
        api.get("/dashboard/counts"),
      ]);

      if (cancelledRef.current) return;

      setAmavasya(extractItems(amResp));
      setUsers(extractItems(uResp));
      setRoles(extractItems(rResp));
      setLocations(extractItems(lResp));
      setPermissions(extractItems(pResp));
      setAmavasyaUserLocations(extractItems(aulResp));
      setUserAttendanceRank(extractItems(attendanceResp));
      setCounts(countsResp?.data?.data ?? {});
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message ?? err?.message;
      setError(serverMsg ?? "Failed to load dashboard data");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [attendanceSearch]);

  useEffect(() => {
    fetchAll();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchAll]);

  return {
    // lists
    amavasya,
    users,
    roles,
    locations,
    permissions,
    amavasyaUserLocations,

    // counts
    counts,

    // leaderboard
    userAttendanceRank,

    // 🔍 search
    attendanceSearch,
    setAttendanceSearch,

    loading,
    error,
  };
}
