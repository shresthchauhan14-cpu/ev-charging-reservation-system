import React from 'react';
import { GraduationCap, Database, CheckCircle2 } from 'lucide-react';

export const AcademicBanner: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">IILM University, Greater Noida</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">B.Tech Computer Science and Engineering</span>
          <span className="text-slate-400 hidden md:inline">•</span>
          <span className="text-emerald-300 font-medium hidden md:inline">Phase I Major Project Prototype</span>
        </div>
        <div className="flex items-center gap-3 ml-auto text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            <Database className="w-3 h-3" />
            <span>PostgreSQL 16 Engine Active</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50 hidden lg:inline-flex">
            <CheckCircle2 className="w-3 h-3" />
            <span>Concurrency Overlap Engine Ready</span>
          </span>
        </div>
      </div>
    </div>
  );
};

