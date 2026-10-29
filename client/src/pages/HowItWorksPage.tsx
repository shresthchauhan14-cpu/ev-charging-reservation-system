import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Layers,
  GraduationCap,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Major Project Technical Architecture Overview</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How VoltReserve Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          An in-depth explanation of our database-backed reservation lifecycle, half-open interval concurrency control, and intelligent priority-driven waiting list reallocation algorithm.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">1. Persistent PostgreSQL Layer</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every charging station, dispenser, vehicle, and reservation is stored in normalized relational tables with check constraints and foreign keys. Availability is never inferred from static mock files.
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
            <li>• Dual-mode adapter (External PostgreSQL + PGlite)</li>
            <li>• Strict relational schemas with TIMESTAMPTZ</li>
            <li>• Version-controlled repeatable SQL migrations</li>
          </ul>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">2. Concurrency Conflict Engine</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            When two drivers attempt to book the same charging point simultaneously, the backend executes inside an ACID transaction and applies the standard half-open interval overlap predicate:
          </p>
          <div className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-lg">
            newStart &lt; existingEnd &amp;&amp; newEnd &gt; existingStart
          </div>
          <p className="text-[11px] text-slate-500">
            Exactly one request receives HTTP 201 Created while conflicting requests receive HTTP 409 Conflict.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">3. Multi-Criteria Reallocation</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            When a reservation is cancelled or marked no-show after the 15-minute grace period, the slot is not wasted. The system computes dynamic priority scores across queued drivers:
          </p>
          <div className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-lg">
            Pᵢ = 0.50·Uᵢ + 0.30·Tᵢ + 0.20·Rᵢ
          </div>
          <p className="text-[11px] text-slate-500">
            The winning driver receives an atomic reservation and in-app notification immediately.
          </p>
        </div>
      </div>

      {/* Step by Step Flow */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight text-center">Complete End-to-End Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-mono text-emerald-400 font-bold text-sm">Step 01</div>
            <div className="font-bold text-white text-sm">Station Discovery</div>
            <p className="text-slate-400">Driver searches Greater Noida hubs, filters by CCS2/Type 2, and queries interval availability.</p>
          </div>
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-mono text-emerald-400 font-bold text-sm">Step 02</div>
            <div className="font-bold text-white text-sm">Database Locking</div>
            <p className="text-slate-400">Transaction commits reservation, generates unique booking reference, and stores audit event.</p>
          </div>
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-mono text-emerald-400 font-bold text-sm">Step 03</div>
            <div className="font-bold text-white text-sm">Check-In Grace Window</div>
            <p className="text-slate-400">Driver scans QR pass at terminal within 15 minutes to initiate charging session.</p>
          </div>
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-mono text-emerald-400 font-bold text-sm">Step 04</div>
            <div className="font-bold text-white text-sm">Dynamic Reallocation</div>
            <p className="text-slate-400">If cancelled or forfeited, algorithm scores queued drivers and re-allocates the slot.</p>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/stations"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md"
        >
          <span>Try Station Booking Demo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

