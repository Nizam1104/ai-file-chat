"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import ChartDialog, { ChartType } from "./ChartDialog";

const chartNames: Record<ChartType, string> = {
  bar: "Bar Chart",
  pie: "Pie Chart",
  line: "Line Chart",
  area: "Area Chart",
  scatter: "Scatter Plot",
  radar: "Radar Chart",
};

const chartDescriptions: Record<ChartType, string> = {
  bar: "Compare values across categories with rectangular bars",
  pie: "Show proportions of a whole with circular segments",
  line: "Show trends over time with connected data points",
  area: "Show trends with filled areas below lines",
  scatter: "Show relationship between two variables with points",
  radar: "Compare multiple metrics on a radial grid",
};

export default function Charts() {
  const [selectedChart, setSelectedChart] = useState<ChartType | null>(null);

  const handleSelectChart = (chartType: ChartType) => {
    setSelectedChart(chartType);
  };

  return (
    <div className="w-full h-full">
      {!selectedChart ? (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Chart Type</h3>
            <p className="text-muted-foreground mb-6">
              Choose from various chart types to visualize your data. Each chart type is suited for different kinds of data analysis.
            </p>
            <ChartDialog onSelectChart={handleSelectChart}>
              <Button className="w-full sm:w-auto">
                <BarChart3 className="h-4 w-4 mr-2" />
                Select Chart Type
              </Button>
            </ChartDialog>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">
                {chartNames[selectedChart]}
              </h2>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {selectedChart.toUpperCase()}
              </span>
            </div>
            <ChartDialog onSelectChart={handleSelectChart}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Change Chart
              </Button>
            </ChartDialog>
          </div>
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-4">
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{chartNames[selectedChart]}</h3>
                <p className="text-muted-foreground mb-4">{chartDescriptions[selectedChart]}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Best For:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedChart === "bar" && (
                      <>
                        <li>• Comparing categories</li>
                        <li>• Showing rankings</li>
                        <li>• Displaying discrete data</li>
                      </>
                    )}
                    {selectedChart === "pie" && (
                      <>
                        <li>• Showing proportions</li>
                        <li>• Displaying percentages</li>
                        <li>• Comparing parts to whole</li>
                      </>
                    )}
                    {selectedChart === "line" && (
                      <>
                        <li>• Showing trends over time</li>
                        <li>• Continuous data</li>
                        <li>• Multiple series comparison</li>
                      </>
                    )}
                    {selectedChart === "area" && (
                      <>
                        <li>• Showing magnitude over time</li>
                        <li>• Cumulative totals</li>
                        <li>• Volume-based trends</li>
                      </>
                    )}
                    {selectedChart === "scatter" && (
                      <>
                        <li>• Correlation analysis</li>
                        <li>• Distribution patterns</li>
                        <li>• Outlier detection</li>
                      </>
                    )}
                    {selectedChart === "radar" && (
                      <>
                        <li>• Multi-dimensional comparison</li>
                        <li>• Performance metrics</li>
                        <li>• Skills assessment</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Data Requirements:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedChart === "bar" && (
                      <>
                        <li>• Categories (X-axis)</li>
                        <li>• Values (Y-axis)</li>
                        <li>• Optional: Multiple series</li>
                      </>
                    )}
                    {selectedChart === "pie" && (
                      <>
                        <li>• Categories</li>
                        <li>• Values/Percentages</li>
                        <li>• Total sum = 100%</li>
                      </>
                    )}
                    {selectedChart === "line" && (
                      <>
                        <li>• Time/Ordered categories</li>
                        <li>• Continuous values</li>
                        <li>• Optional: Multiple lines</li>
                      </>
                    )}
                    {selectedChart === "area" && (
                      <>
                        <li>• Time/Ordered categories</li>
                        <li>• Values for areas</li>
                        <li>• Stackable data</li>
                      </>
                    )}
                    {selectedChart === "scatter" && (
                      <>
                        <li>• X-axis values</li>
                        <li>• Y-axis values</li>
                        <li>• Optional: Point size/color</li>
                      </>
                    )}
                    {selectedChart === "radar" && (
                      <>
                        <li>• Multiple metrics</li>
                        <li>• Same scale range</li>
                        <li>• 3+ data points</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Upload your data file and select this chart type to visualize your own data!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}