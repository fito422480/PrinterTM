import DashboardCard from "@/components/dashboard/DashboardCard";
import PostsTable from "@/components/posts/PostsTable";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import { Send, CopyX, ListChecks, CircleX } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function Home() {
  const formatNumber = (num: number) =>
    new Intl.NumberFormat("es-ES").format(num);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between gap-5 mb-5">
        <DashboardCard
          title="ENVIADAS"
          count={100000}
          formattedCount={formatNumber(100000)} // Pasar el número formateado
          icon={<Send className="text-blue-950" size={52} />}
        />
        <DashboardCard
          title="APROBADAS"
          count={88000}
          formattedCount={formatNumber(88000)}
          icon={<ListChecks className="text-blue-950" size={52} />}
        />
        <DashboardCard
          title="RECHAZADAS"
          count={10000}
          formattedCount={formatNumber(10000)}
          icon={<CircleX className="text-blue-950" size={52} />}
        />
        <DashboardCard
          title="ERRORES"
          count={2000}
          formattedCount={formatNumber(2000)}
          icon={<CopyX className="text-blue-950" size={52} />}
        />
      </div>
      <AnalyticsChart />
      <PostsTable title="Facturas" limit={3} />
      <SpeedInsights />
    </>
  );
}
