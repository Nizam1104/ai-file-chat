"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Desktop", value: 45, color: "#8884d8" },
  { name: "Mobile", value: 30, color: "#82ca9d" },
  { name: "Tablet", value: 15, color: "#ffc658" },
  { name: "Smart TV", value: 7, color: "#ff7c7c" },
  { name: "Other", value: 3, color: "#8dd1e1" },
];

export default function PieChartExample() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Device Usage Distribution</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-4">
        This pie chart shows the distribution of device usage across different platforms. It&apos;s ideal for showing proportions and percentages of a whole.
      </p>
    </div>
  );
}