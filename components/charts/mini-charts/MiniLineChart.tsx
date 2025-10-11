"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", website: 4000, mobile: 2400 },
  { month: "Feb", website: 3000, mobile: 1398 },
  { month: "Mar", website: 2000, mobile: 9800 },
  { month: "Apr", website: 2780, mobile: 3908 },
  { month: "May", website: 1890, mobile: 4800 },
  { month: "Jun", website: 2390, mobile: 3800 },
];

export default function MiniLineChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="website" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="mobile" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}