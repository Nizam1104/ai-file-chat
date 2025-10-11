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
  { x: 200, y: 400, z: 550 },
  { x: 160, y: 320, z: 380 },
  { x: 130, y: 280, z: 300 },
];

export default function ScatterChartExample() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Price vs Demand Analysis</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Price"
            unit="$"
            domain={[80, 220]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Demand"
            unit="units"
            domain={[0, 500]}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter
            name="Product Demand"
            data={data}
            fill="#8884d8"
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-4">
        This scatter plot shows the relationship between price and demand. Ideal for identifying correlations and patterns between two variables.
      </p>
    </div>
  );
}