"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", website: 4000, mobile: 2400, api: 2400 },
  { month: "Feb", website: 3000, mobile: 1398, api: 2210 },
  { month: "Mar", website: 2000, mobile: 9800, api: 2290 },
  { month: "Apr", website: 2780, mobile: 3908, api: 2000 },
  { month: "May", website: 1890, mobile: 4800, api: 2181 },
  { month: "Jun", website: 2390, mobile: 3800, api: 2500 },
  { month: "Jul", website: 3490, mobile: 4300, api: 2100 },
];

export default function LineChartExample() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-4">User Traffic Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="website" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="mobile" stroke="#82ca9d" strokeWidth={2} />
          <Line type="monotone" dataKey="api" stroke="#ffc658" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-4">
        This line chart displays user traffic trends across different platforms over time. Perfect for showing trends and patterns in time-series data.
      </p>
    </div>
  );
}