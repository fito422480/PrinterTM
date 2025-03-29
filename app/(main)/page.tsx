"use client";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PostsTable from "@/components/posts/PostsTable";
import { getBackendStatsUrl, getRuntimeEnv } from "@/utils/runtime-env";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CircleX, CopyX, ListChecks, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState({
    sent: 0,
    approved: 0,
    rejected: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl =
        getBackendStatsUrl() || getRuntimeEnv("NEXT_PUBLIC_URL_BACKEND_STATS");
      if (!apiUrl) {
        throw new Error("La URL del backend no está configurada.");
      }
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const result = await response.json();

      // Verifica la estructura de los datos antes de asignarlos
      console.log(result); // Verifica los datos que recibes

      setData({
        sent: result.SENT || 0,
        approved: result.APPROVED || 0,
        rejected: result.REJECTED || 0,
        errors: result.ERRORS || 0,
      });
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("es-ES").format(num);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between gap-5 mb-5">
        <DashboardCard
          title="ENVIADAS"
          count={data.sent}
          formattedCount={formatNumber(data.sent)}
          icon={<Send className="text-blue-950" size={52} />}
        />
        <DashboardCard
          title="APROBADAS"
          count={data.approved}
          formattedCount={formatNumber(data.approved)}
          icon={<ListChecks className="text-blue-950" size={52} />}
        />
        <DashboardCard
          title="RECHAZADAS"
          count={data.rejected}
          formattedCount={formatNumber(data.rejected)}
          icon={<CircleX className="text-blue-950" size={52} />}
        />
        <DashboardCard
          title="ERRORES"
          count={data.errors}
          formattedCount={formatNumber(data.errors)}
          icon={<CopyX className="text-blue-950" size={52} />}
        />
      </div>
      <AnalyticsChart />
      <PostsTable title="Facturas" limit={3} />
      <SpeedInsights />
    </>
  );
}
