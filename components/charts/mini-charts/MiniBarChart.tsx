"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", sales: 4000, revenue: 2400, profit: 2400 },
  { month: "Feb", sales: 3000, revenue: 1398, profit: 2210 },
  { month: "Mar", sales: 2000, revenue: 9800, profit: 2290 },
  { month: "Apr", sales: 2780, revenue: 3908, profit: 2000 },
  { month: "May", sales: 1890, revenue: 4800, profit: 2181 },
  { month: "Jun", sales: 2390, revenue: 3800, profit: 2500 },
];

export default function MiniBarChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="sales" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}