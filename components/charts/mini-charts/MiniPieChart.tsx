"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Desktop", value: 45, color: "#8884d8" },
  { name: "Mobile", value: 30, color: "#82ca9d" },
  { name: "Tablet", value: 15, color: "#ffc658" },
  { name: "Other", value: 10, color: "#ff7c7c" },
];

export default function MiniPieChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={40}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}