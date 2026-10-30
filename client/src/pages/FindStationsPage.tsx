import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  Zap,
  Filter,
  ArrowRight,
  BatteryCharging,
  SlidersHorizontal,
  Compass,
  CheckCircle,
  AlertTriangle,
  Map as MapIcon,
  List as ListIcon,
  Activity,
  Radio,
  Wifi,
} from 'lucide-react';
import { api } from '../services/api';
import { ChargingStation } from '../types';
import {
  isSupabaseConfigured,
  subscribeToRealtimeAvailability,
  unsubscribeChannel,
} from '../services/supabase';

export const FindStationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState<boolean>(false);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [connectorType, setConnectorType] = useState(searchParams.get('connectorType') || '');
  const [minPower, setMinPower] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'available' | 'power' | 'price'>('available');

  const fetchStations = async () => {
    setLoading(true);
    try {
      const data = await api.getStations({
        search: searchQuery,
        city: cityFilter,
        connectorType: connectorType || undefined,
      });
      setStations(data);
    } catch (err) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, [searchQuery, cityFilter, connectorType]);

  // Set up Supabase Realtime Subscription
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setRealtimeActive(configured);

    if (configured) {
      const channel = subscribeToRealtimeAvailability((payload) => {
        setLastRealtimeEvent(`Event: ${payload.table} (${payload.eventType}) at ${new Date().toLocaleTimeString()}`);
        // Re-fetch stations to reflect updated availability counts
        api.getStations({
          search: searchQuery,
          city: cityFilter,
          connectorType: connectorType || undefined,
        }).then(setStations).catch(console.error);

        // Clear notification pill after 5 seconds
        setTimeout(() => setLastRealtimeEvent(null), 5000);
      });

      return () => {
        if (channel) unsubscribeChannel(channel);
      };
    }
  }, [searchQuery, cityFilter, connectorType]);

  // Apply in-memory power filter & sorting
  const filteredStations = stations
    .filter((s) => s.maxPowerKw >= minPower)
    .sort((a, b) => {
      if (sortBy === 'available') return b.availablePoints - a.availablePoints;
      if (sortBy === 'power') return b.maxPowerKw - a.maxPowerKw;
      if (sortBy === 'price') return a.minPricePerKwh - b.minPricePerKwh;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Charging Stations Explorer</h1>
            {realtimeActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Realtime Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>PostgreSQL Dual-Engine</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Discover verified EV charging points across Greater Noida with database-recorded real-time availability.
          </p>
          {lastRealtimeEvent && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-300 animate-pulse">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Synced: {lastRealtimeEvent}</span>
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Greater Noida Map</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station name, address, or sector..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Connector Filter */}
          <div className="md:col-span-3">
            <select
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
            >
              <option value="">All Connectors</option>
              <option value="CCS2">CCS2 (DC Fast Charge)</option>
              <option value="TYPE2">Type 2 (Standard AC)</option>
              <option value="GBT">GB/T</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
            >
              <option value="available">Sort: Availability</option>
              <option value="power">Sort: Max Power (kW)</option>
              <option value="price">Sort: Price (Lowest)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setCityFilter('');
                setConnectorType('');
                setMinPower(0);
              }}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Quick Connector Chips & Power Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Standard:</span>
            {[
              { label: 'All', value: '' },
              { label: 'CCS2 (DC Fast)', value: 'CCS2' },
              { label: 'Type 2 (AC)', value: 'TYPE2' },
              { label: 'GB/T', value: 'GBT' },
            ].map((c) => (
              <button
                key={c.label}
                onClick={() => setConnectorType(c.value)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  connectorType === c.value
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Power:</span>
            {[0, 50, 100, 150].map((kw) => (
              <button
                key={kw}
                onClick={() => setMinPower(kw)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  minPower === kw
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {kw === 0 ? 'Any kW' : `≥ ${kw} kW`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area: Map or List */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Greater Noida Interactive Geo-Layout</h3>
              <p className="text-xs text-slate-500">
                Visual coordinate distribution representing major academic and highway transit terminals.
              </p>
            </div>
            <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              4 Active Stations
            </div>
          </div>

          {/* Simulated Greater Noida Map SVG Canvas */}
          <div className="relative w-full h-96 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-6">
            <svg className="w-full h-full opacity-40 absolute inset-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Highway Corridor Line (Yamuna Expressway) */}
              <line x1="10%" y1="90%" x2="90%" y2="20%" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" />
            </svg>

            {/* Station Map Pins */}
            <div className="relative z-10 w-full h-full">
              {filteredStations.map((station, idx) => {
                // Approximate coordinate mapping to relative %
                const xPercent = 25 + idx * 20;
                const yPercent = 30 + (idx % 2) * 35;

                return (
                  <div
                    key={station.id}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/30 animate-ping absolute" />
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* Tooltip Card */}
                    <div className="absolute left-1/2 bottom-9 -translate-x-1/2 w-52 bg-white text-slate-900 p-2.5 rounded-xl shadow-xl border border-slate-200 pointer-events-auto opacity-95 text-xs space-y-1">
                      <div className="font-bold truncate text-slate-900">{station.name}</div>
                      <div className="text-[11px] text-slate-500">{station.availablePoints} points free • Up to {station.maxPowerKw} kW</div>
                      <Link
                        to={`/stations/${station.id}`}
                        className="inline-block mt-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Reserve Slot →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              Yamuna Expressway & Knowledge Park Transit Corridor
            </div>
          </div>
        </div>
      ) : null}

      {/* Stations List Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Querying PostgreSQL charging stations...</p>
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">No Matching Charging Stations</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No stations match your selected filters. Try clearing the search query or selecting "All Connectors".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setConnectorType('');
              setMinPower(0);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStations.map((station) => (
            <div
              key={station.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                {/* Header Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{station.operatingStatus}</span>
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{station.name}</h3>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs border bg-slate-50 border-slate-200">
                      <span className={`w-2 h-2 rounded-full ${station.availablePoints > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className={station.availablePoints > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {station.availablePoints} / {station.totalPoints} Free
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Real-time Dispenser Grid</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{station.description}</p>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{station.address}</span>
                </div>

                {/* Specs Pill Grid */}
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium text-slate-700">Max {station.maxPowerKw} kW</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">₹{station.minPricePerKwh}/kWh</span>
                  </div>

                  {station.connectorTypes.map((c) => {
                    const isCCS2 = c.toUpperCase().includes('CCS');
                    const isType2 = c.toUpperCase().includes('TYPE2');
                    return (
                      <span
                        key={c}
                        className={`font-semibold px-2 py-1 rounded-lg border text-[11px] ${
                          isCCS2
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isType2
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {c}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Hours: {station.openingTime.slice(0, 5)} - {station.closingTime.slice(0, 5)}
                </span>
                <Link
                  to={`/stations/${station.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <span>Select Slot & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

