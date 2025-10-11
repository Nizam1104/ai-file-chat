"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";

const data = [
  { skill: "JavaScript", current: 85, target: 90 },
  { skill: "React", current: 80, target: 95 },
  { skill: "TypeScript", current: 75, target: 85 },
  { skill: "Node.js", current: 70, target: 80 },
  { skill: "CSS", current: 88, target: 85 },
  { skill: "Python", current: 65, target: 75 },
];

export default function RadarChartExample() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-4">Skills Assessment</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Current Level"
            dataKey="current"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Radar
            name="Target Level"
            dataKey="target"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.6}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted-foreground mt-4">
        This radar chart compares current skill levels against target goals. Perfect for comparing multiple metrics across different categories.
      </p>
    </div>
  );
}