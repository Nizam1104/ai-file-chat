"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", revenue: 4000, costs: 2400 },
  { month: "Feb", revenue: 3000, costs: 1398 },
  { month: "Mar", revenue: 2000, costs: 800 },
  { month: "Apr", revenue: 2780, costs: 908 },
  { month: "May", revenue: 1890, costs: 800 },
  { month: "Jun", revenue: 2390, costs: 800 },
];

export default function MiniAreaChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Area type="monotone" dataKey="costs" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}