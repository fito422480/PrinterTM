import DashboardCard from "@/components/dashboard/DashboardCard";
import PostsTable from "@/components/posts/PostsTable";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import { Send, CopyX, ListChecks, CircleX } from "lucide-react";

export default function Home() {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between gap-5 mb-5">
        <DashboardCard
          title="ENVIADAS"
          count={100000}
          icon={<Send className="text-blue" size={52} />}
        />
        <DashboardCard
          title="APROBADAS"
          count={88000}
          icon={<ListChecks className="text-blue" size={52} />}
        />
        <DashboardCard
          title="RECHAZADAS"
          count={10000}
          icon={<CircleX className="text-blue" size={52} />}
        />
        <DashboardCard
          title="ERRORES"
          count={2000}
          icon={<CopyX className="text-blue" size={52} />}
        />
      </div>
      <AnalyticsChart />
      <PostsTable title="Facturas" limit={5} />
    </>
  );
}
