"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", revenue: 4000, costs: 2400, profit: 1600 },
  { month: "Feb", revenue: 3000, costs: 1398, profit: 1602 },
  { month: "Mar", revenue: 2000, costs: 800, profit: 1200 },
  { month: "Apr", revenue: 2780, costs: 908, profit: 1872 },
  { month: "May", revenue: 1890, costs: 800, profit: 1090 },
  { month: "Jun", revenue: 2390, costs: 800, profit: 1590 },
  { month: "Jul", revenue: 3490, costs: 1300, profit: 2190 },
];

export default function AreaChartExample() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Revenue vs Costs Analysis</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="costs" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-4">
        This area chart visualizes revenue and costs over time with filled areas. Great for showing magnitude and trends in cumulative data.
      </p>
    </div>
  );
}