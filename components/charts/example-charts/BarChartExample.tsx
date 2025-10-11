"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", sales: 4000, revenue: 2400, profit: 2400 },
  { month: "Feb", sales: 3000, revenue: 1398, profit: 2210 },
  { month: "Mar", sales: 2000, revenue: 9800, profit: 2290 },
  { month: "Apr", sales: 2780, revenue: 3908, profit: 2000 },
  { month: "May", sales: 1890, revenue: 4800, profit: 2181 },
  { month: "Jun", sales: 2390, revenue: 3800, profit: 2500 },
  { month: "Jul", sales: 3490, revenue: 4300, profit: 2100 },
];

export default function BarChartExample() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Monthly Sales Performance</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sales" fill="#8884d8" />
          <Bar dataKey="revenue" fill="#82ca9d" />
          <Bar dataKey="profit" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-4">
        This bar chart shows monthly sales, revenue, and profit data. It&apos;s useful for comparing multiple metrics across different time periods.
      </p>
    </div>
  );
}