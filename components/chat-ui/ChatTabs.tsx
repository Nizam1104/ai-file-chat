"use client"
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIAnalysis from "./AIAnalysis";
import Charts from "../charts/Charts";

export default function ChatTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("ai-analyse");

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && (tabFromUrl === "ai-analyse" || tabFromUrl === "charts")) {
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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ai-analyse">AI Analyse</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
      </TabsList>
      <TabsContent value="ai-analyse" className="mt-6 h-full">
        <AIAnalysis />
      </TabsContent>
      <TabsContent value="charts" className="mt-6 h-full">
        <Charts />
      </TabsContent>
    </Tabs>
  );
}
