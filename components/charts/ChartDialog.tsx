"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, LineChart, AreaChart, ScatterChart, Activity } from "lucide-react";
import MiniBarChart from "./mini-charts/MiniBarChart";
import MiniPieChart from "./mini-charts/MiniPieChart";
import MiniLineChart from "./mini-charts/MiniLineChart";
import MiniAreaChart from "./mini-charts/MiniAreaChart";
import MiniScatterChart from "./mini-charts/MiniScatterChart";
import MiniRadarChart from "./mini-charts/MiniRadarChart";

export type ChartType = "bar" | "pie" | "line" | "area" | "scatter" | "radar";

interface ChartDialogProps {
  onSelectChart: (chartType: ChartType) => void;
  children: React.ReactNode;
}

const chartOptions = [
  {
    type: "bar" as ChartType,
    name: "Bar Chart",
    icon: BarChart3,
    description: "Compare values across categories",
    component: MiniBarChart
  },
  {
    type: "pie" as ChartType,
    name: "Pie Chart",
    icon: PieChart,
    description: "Show proportions of a whole",
    component: MiniPieChart
  },
  {
    type: "line" as ChartType,
    name: "Line Chart",
    icon: LineChart,
    description: "Show trends over time",
    component: MiniLineChart
  },
  {
    type: "area" as ChartType,
    name: "Area Chart",
    icon: AreaChart,
    description: "Show trends with filled areas",
    component: MiniAreaChart
  },
  {
    type: "scatter" as ChartType,
    name: "Scatter Plot",
    icon: ScatterChart,
    description: "Show relationship between variables",
    component: MiniScatterChart
  },
  {
    type: "radar" as ChartType,
    name: "Radar Chart",
    icon: Activity,
    description: "Compare multiple metrics",
    component: MiniRadarChart
  },
];

export default function ChartDialog({ onSelectChart, children }: ChartDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSelectChart = (chartType: ChartType) => {
    onSelectChart(chartType);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Chart Type</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {chartOptions.map(({ type, name, icon: Icon, description, component: ChartComponent }) => (
            <Button
              key={type}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-3 hover:bg-accent hover:border-primary"
              onClick={() => handleSelectChart(type)}
            >
              <div className="w-full">
                <ChartComponent />
              </div>
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-base">{name}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">{description}</p>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}