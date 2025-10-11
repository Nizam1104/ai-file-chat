"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
  { x: 180, y: 350, z: 450 },
];

export default function MiniScatterChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} domain={[80, 200]} />
          <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} domain={[0, 500]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Data" data={data} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}