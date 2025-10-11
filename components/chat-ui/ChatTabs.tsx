"use client"
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileDataTable from "./FileDataTable";
import AIAnalysis from "./AIAnalysis";
import Charts from "../charts/Charts";

interface ChatTabsProps {
  queryResults: Record<string, unknown>[];
  currentQuery: string;
  clearResults: () => void;
}

export default function ChatTabs({ queryResults, currentQuery, clearResults }: ChatTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("file-data");

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && (tabFromUrl === "file-data" || tabFromUrl === "ai-analyse" || tabFromUrl === "charts")) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="file-data">File Data</TabsTrigger>
        <TabsTrigger value="ai-analyse">AI Analyse</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
      </TabsList>
      <TabsContent value="file-data" className="mt-6">
        <FileDataTable isActive={activeTab === "file-data"} />
      </TabsContent>
      <TabsContent value="ai-analyse" className="mt-6 h-full">
        <AIAnalysis
          queryResults={queryResults}
          currentQuery={currentQuery}
          clearResults={clearResults}
        />
      </TabsContent>
      <TabsContent value="charts" className="mt-6 h-full">
        <Charts />
      </TabsContent>
    </Tabs>
  );
}
