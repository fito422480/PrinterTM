import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  count: number;
  formattedCount?: string; // Nueva propiedad opcional
  icon: React.ReactElement<LucideIcon>;
}

const DashboardCard = ({
  title,
  count,
  formattedCount,
  icon,
}: DashboardCardProps) => {
  return (
    <Card className="bg-secondary p-4 pb-0">
      <CardContent>
        <h3 className="text-3xl text-center mb-4 font-bold text-blue">
          {title}
        </h3>
        <div className="flex gap-5 justify-center items-center">
          {icon}
          <h3 className="text-5xl font-semibold text-blue">
            {formattedCount || count}{" "}
            {/* Mostrar formattedCount si está disponible */}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
