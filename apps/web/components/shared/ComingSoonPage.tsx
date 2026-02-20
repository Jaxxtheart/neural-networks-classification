import React from "react";
import { Construction } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export default function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-16 h-16 rounded-[12px] flex items-center justify-center mb-5"
        style={{ backgroundColor: "rgba(80,70,229,0.12)" }}
      >
        <Construction size={28} style={{ color: "var(--etihuku-indigo-light)" }} />
      </div>
      <h1
        className="text-h3 text-white mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <p className="text-[14px] text-[var(--etihuku-gray-400)] max-w-md leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <a href="/overview" className="btn btn-secondary btn-sm">
          ← Back to Overview
        </a>
        <button className="btn btn-primary btn-sm">Request Early Access</button>
      </div>
    </div>
  );
}
