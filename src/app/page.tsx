"use client";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import TeamTab from "@/components/TeamTab";
import TechTab from "@/components/TechTab";
import ComptaTab from "@/components/ComptaTab";
import CompanyHeader from "@/components/CompanyHeader";
import { Building2, Code2, Calculator } from "lucide-react";

const tabs = [
  { id: "team", label: "Équipe", icon: Building2 },
  { id: "tech", label: "Technique", icon: Code2 },
  { id: "compta", label: "Comptabilité", icon: Calculator },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("team");
  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-950">
        <CompanyHeader />
        <nav className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-sky-500 text-sky-400"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === "team" && <TeamTab />}
          {activeTab === "tech" && <TechTab />}
          {activeTab === "compta" && <ComptaTab />}
        </main>
      </div>
    </AuthGate>
  );
}
