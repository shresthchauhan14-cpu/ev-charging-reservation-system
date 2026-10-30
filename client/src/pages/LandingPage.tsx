import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Sliders,
  BatteryCharging,
  Sparkles,
  CloudLightning,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { ChargingStation } from '../types';
import { EVChargingAnimation } from '../components/common/EVChargingAnimation';
import { isSupabaseConfigured } from '../services/supabase';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [searchCity, setSearchCity] = useState('Greater Noida');
  const [connectorFilter, setConnectorFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Interactive Special EV Charging Animation State
  const [isChargingAnimationOpen, setIsChargingAnimationOpen] = useState(false);
  const [animationTargetStation, setAnimationTargetStation] = useState('Greater Noida EV Hub');

  const isSupabaseActive = isSupabaseConfigured();

  useEffect(() => {
    api.getStations()
      .then((data) => setStations(data.slice(0, 4)))
      .catch(console.error);
  }, []);

  const triggerChargingAnimationAndNavigate = (stationName?: string) => {
    if (stationName) {
      setAnimationTargetStation(stationName);
    }
    setIsChargingAnimationOpen(true);
  };

  const handleAnimationComplete = () => {
    setIsChargingAnimationOpen(false);
    const params = new URLSearchParams();
    if (searchCity) params.append('city', searchCity);
    if (connectorFilter) params.append('connectorType', connectorFilter);
    navigate(`/stations?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerChargingAnimationAndNavigate();
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Reusable Interactive EV Charging Animation Overlay */}
      <EVChargingAnimation
        isOpen={isChargingAnimationOpen}
        onClose={() => setIsChargingAnimationOpen(false)}
        onComplete={handleAnimationComplete}
        targetStationName={animationTargetStation}
      />

      {/* Hero Section with Premium Automotive Visual Styling */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-12 pb-24 border-b border-slate-800">
        {/* Ambient Neon Backlights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/40 shadow-xs shadow-emerald-500/20">
                <CloudLightning className="w-3.5 h-3.5 text-emerald-400" />
                <span>Next-Gen EV Mobility • Greater Noida Infrastructure</span>
                {isSupabaseActive && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/30 text-emerald-200">
                    Supabase Live
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Find Your Charger.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 block">
                  Book Your Slot.
                </span>{' '}
                Drive Forward.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Experience guaranteed electric mobility with PostgreSQL database-enforced reservation concurrency and an intelligent, multi-criteria waiting-list reallocation algorithm for released charging slots.
              </p>

              {/* Action Buttons with Primary Animated Trigger */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => triggerChargingAnimationAndNavigate('Knowledge Park III Hub')}
                  className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current text-slate-950 group-hover:animate-bounce" />
                  <span>Find EV Charging Stations</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 transition-transform group-hover:translate-x-1" />
                  
                  {/* Subtle Shimmer Effect */}
                  <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <span className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </span>
                </button>

                <Link
                  to="/stations"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <span>Explore Stations</span>
                </Link>

                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
                >
                  <span>How It Works</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Double-Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Smart Priority Queue (Pᵢ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>PostgreSQL ACID Locked</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Search Panel & EV Charger Illustration */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 rounded-3xl shadow-2xl shadow-slate-950/80 border border-slate-800 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-white text-lg">Reserve a Charging Slot</h3>
                    <p className="text-xs text-slate-400">Real-time availability across Greater Noida</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <BatteryCharging className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Hub Location / Region
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        placeholder="e.g. Greater Noida, Knowledge Park III"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-950 text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Connector Type
                      </label>
                      <select
                        value={connectorFilter}
                        onChange={(e) => setConnectorFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-950 text-white"
                      >
                        <option value="">All Connectors</option>
                        <option value="CCS2">CCS2 (DC Rapid)</option>
                        <option value="TYPE2">Type 2 (AC Fast)</option>
                        <option value="GBT">GB/T</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-950 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Search Available Charging Slots</span>
                  </button>
                </form>

                {/* Real-Time Pilot Status */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Operational Pilot Grid</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold">4 Hubs • 13 Dispensers</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>High-Reliability Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Engineered to Solve Real-World EV Charging Congestion
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Eliminating peak-hour queue uncertainty, phantom reservations, and charging slot contention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Real-Time Availability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Query verified dispenser statuses and recorded time windows computed directly from the PostgreSQL engine.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Zero Overlap Concurrency</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Database-level interval locking and serializable transactions guarantee that simultaneous users never book conflicting slots.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Smart Slot Reallocation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a booking is cancelled or marked no-show, the intelligent queue allocates the slot to the highest-priority waiting driver.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Mathematical Fairness</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent priority scoring balancing State of Charge urgency (50%), elapsed wait time (30%), and driver reliability (20%).
            </p>
          </div>
        </div>
      </section>

      {/* Differentiating Feature: Smart Waiting List Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                <Cpu className="w-3.5 h-3.5" />
                <span>Primary Research Differentiation</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Intelligent Waiting-List Allocation Engine
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Unlike primitive first-come, first-served queues that leave stranded drivers with critical batteries unassisted, our system applies a multi-criteria priority model:
              </p>

              {/* Mathematical Equation Display */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300">
                Pᵢ = 0.50 · Uᵢ + 0.30 · Tᵢ + 0.20 · Rᵢ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-emerald-400 font-bold mb-1">α = 0.50 (Urgency)</div>
                  <div className="text-slate-400">Uᵢ = 1 − SOCᵢ. Lower battery charge yields exponentially higher scheduling priority.</div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-sky-400 font-bold mb-1">β = 0.30 (Wait Time)</div>
                  <div className="text-slate-400">Tᵢ = min(wait / 60, 1). Prevents queue starvation for drivers waiting for extended intervals.</div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-purple-400 font-bold mb-1">γ = 0.20 (Reliability)</div>
                  <div className="text-slate-400">Rᵢ ∈ [0, 1]. Incentivizes on-time arrivals and penalizes repetitive no-shows.</div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/waiting-list"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
                >
                  <span>Launch Live Allocation Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right preview badge */}
            <div className="lg:col-span-5 bg-slate-950/70 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Queue State Preview
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs">Amit Singh (Ioniq 5)</div>
                    <div className="text-[11px] text-slate-400">SOC: 15% • Wait: 45m • Rel: 0.95</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      P = 0.840
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rank #1</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-300 text-xs">Priya Verma (MG ZS)</div>
                    <div className="text-[11px] text-slate-400">SOC: 35% • Wait: 25m • Rel: 0.90</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      P = 0.630
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rank #2</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-300 text-xs">Sneha Patel (XUV400)</div>
                    <div className="text-[11px] text-slate-400">SOC: 60% • Wait: 50m • Rel: 0.85</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      P = 0.620
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rank #3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stations in Greater Noida with Custom Visual Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Greater Noida Hubs</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Verified operational stations equipped with high-speed CCS2, Type 2, and GB/T charging dispensers.
            </p>
          </div>
          <Link
            to="/stations"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Stations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stations.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{s.operatingStatus}</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {s.availablePoints}/{s.totalPoints} Free
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{s.address}</p>
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {s.connectorTypes.map((c) => (
                    <span
                      key={c}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        c === 'CCS2'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c === 'TYPE2'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Up to {s.maxPowerKw} kW
                  </span>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">₹{s.minPricePerKwh}/kWh</span>
                <button
                  type="button"
                  onClick={() => triggerChargingAnimationAndNavigate(s.name)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Lifecycle Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 rounded-3xl p-8 sm:p-12 border border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">How the Reservation Lifecycle Works</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Three streamlined steps from station discovery to confirmed plug-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Select Hub & Interval</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter by connector type (CCS2, Type 2, GB/T) and power rating. Select your requested date and time interval.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Instant Concurrency Lock</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PostgreSQL checks the half-open interval. If free, your slot is instantly reserved and a verifiable booking reference is created.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Arrival or Reallocation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check in upon arrival. In case of cancellation or no-show, the system reallocates the slot directly to the highest priority waiting driver.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive EV Charging Pulse Animation Modal */}
      <EVChargingAnimation
        isOpen={isChargingAnimationOpen}
        onClose={() => setIsChargingAnimationOpen(false)}
        onComplete={handleAnimationComplete}
        targetStationName={animationTargetStation}
      />
    </div>
  );
};
