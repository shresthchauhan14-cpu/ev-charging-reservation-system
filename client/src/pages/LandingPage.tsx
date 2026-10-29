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
} from 'lucide-react';
import { api } from '../services/api';
import { ChargingStation } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [searchCity, setSearchCity] = useState('Greater Noida');
  const [connectorFilter, setConnectorFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.getStations().then((data) => setStations(data.slice(0, 3))).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.append('city', searchCity);
    if (connectorFilter) params.append('connectorType', connectorFilter);
    navigate(`/stations?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white pt-12 pb-20 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold tracking-wide border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Next-Gen EV Infrastructure • Greater Noida Pilot</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Find Your Charger.{' '}
                <span className="text-emerald-600 block">Book Your Slot.</span>{' '}
                Drive Forward.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Experience guaranteed electric vehicle charging with database-enforced reservation concurrency and an intelligent, priority-driven waiting-list algorithm for released slots.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/stations"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:translate-y-[-1px]"
                >
                  <span>Find Charging Stations</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors"
                >
                  <span>Explore How It Works</span>
                </Link>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero Double-Booking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>Smart Priority Queue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>PostgreSQL ACID</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Search Panel */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Reserve a Charging Slot</h3>
                    <p className="text-xs text-slate-500">Find real-time available points in Greater Noida</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Location / Region
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        placeholder="e.g. Greater Noida, Knowledge Park"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Connector Type
                      </label>
                      <select
                        value={connectorFilter}
                        onChange={(e) => setConnectorFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                      >
                        <option value="">All Connectors</option>
                        <option value="CCS2">CCS2 (DC Fast)</option>
                        <option value="TYPE2">Type 2 (AC)</option>
                        <option value="GBT">GB/T</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Search Available Charging Slots</span>
                  </button>
                </form>

                <div className="text-[11px] text-slate-400 text-center">
                  Demonstration pilot verified with Knowledge Park & Pari Chowk hubs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Engineered for High-Reliability EV Charging
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            A comprehensive solution resolving peak-hour EV charging congestion, queue uncertainty, and slot conflicts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Real-Time Availability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Query recorded charging point statuses and reserved time windows computed directly from the PostgreSQL engine.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Zero Overlap Concurrency</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Database-level interval locking and serializable transactions guarantee that simultaneous users never book conflicting slots.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Smart Slot Reallocation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a booking is cancelled or marked no-show, the intelligent queue allocates the slot to the highest-priority waiting driver.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-colors"
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

      {/* Featured Stations in Greater Noida */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Greater Noida Hubs</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Verified demonstration stations equipped with fast CCS2 and standard AC charging dispensers.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stations.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{s.operatingStatus}</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {s.availablePoints}/{s.totalPoints} Available
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{s.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{s.address}</p>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {s.connectorTypes.map((c) => (
                    <span key={c} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {c}
                    </span>
                  ))}
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                    Up to {s.maxPowerKw} kW
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    ₹{s.minPricePerKwh}/kWh
                  </span>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">{s.city}</span>
                <Link
                  to={`/stations/${s.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Select Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Process Explanation */}
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
    </div>
  );
};

