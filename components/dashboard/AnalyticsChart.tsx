"use client";

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

import data from "@/data/analytics";

const AnalyticsChart = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Análisis para este año</CardTitle>
          <CardDescription>Facturas Aprobadas por Mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart width={1100} height={300} data={data}>
                <Line type="monotone" dataKey="uv" stroke="#001950" />
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="name" />
                <YAxis />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AnalyticsChart;
