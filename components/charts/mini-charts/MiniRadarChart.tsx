"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const data = [
  { skill: "JS", current: 85, target: 90 },
  { skill: "React", current: 80, target: 95 },
  { skill: "TS", current: 75, target: 85 },
  { skill: "Node", current: 70, target: 80 },
  { skill: "CSS", current: 88, target: 85 },
];

export default function MiniRadarChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}