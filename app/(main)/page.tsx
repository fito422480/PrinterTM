"use client";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PostsTable from "@/components/posts/PostsTable";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CircleX, CopyX, ListChecks, RotateCw, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
      const statsUrl = `/api/proxy/stats`;

      const response = await fetch(statsUrl, {
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
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-5 mb-5">
        {loading ? (
          <>
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <Skeleton className="h-[120px] w-full rounded-xl" />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      <AnalyticsChart />
      <PostsTable title="Facturas" limit={3} />
      <SpeedInsights />
    </>
  );
}
