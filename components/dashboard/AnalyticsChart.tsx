"use client";

import { useEffect, useState } from "react";
import { AnalyticsItem } from "@/types/analytics";
import fetchAnalytics from "@/data/analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AnalyticsChart = () => {
  const [data, setData] = useState<AnalyticsItem[]>([]); // ✅ Tipado correcto

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchAnalytics();
      setData(result);
    };
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis para este año</CardTitle>
        <CardDescription>Facturas Aprobadas por Mes</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          style={{ width: "100%", height: 300 }}
          className="flex gap-5 justify-center items-center"
        >
          <ResponsiveContainer>
            <LineChart width={1000} height={300} data={data}>
              <Line type="monotone" dataKey="UV" stroke="#001950" />
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="month" />
              <YAxis />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
