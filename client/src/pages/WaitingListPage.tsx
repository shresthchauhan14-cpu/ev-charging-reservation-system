import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  Clock,
  BatteryMedium,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { WaitingListEntry, ChargingStation } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const WaitingListPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // Join waiting list modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [targetPointId, setTargetPointId] = useState<number | null>(null);
  const [socInput, setSocInput] = useState<number>(20);
  const [customWaitMinutes, setCustomWaitMinutes] = useState<number>(30);
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [queueData, stnData] = await Promise.all([
        api.getWaitingList(undefined, true),
        api.getStations(),
      ]);
      setEntries(queueData.entries);
      setStations(stnData);
      if (stnData.length > 0 && stnData[0].chargingPoints?.length) {
        setTargetPointId(stnData[0].chargingPoints[0].id);
      }
    } catch (err) {
      console.error('Error fetching waiting list queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSimulateAllocation = async () => {
    // Default to KP3-DC-02 if available
    let pointId = targetPointId;
    if (!pointId && entries.length > 0) {
      pointId = entries[0].chargingPointId;
    }
    if (!pointId) {
      alert('No charging point available for simulation.');
      return;
    }

    setSimulating(true);
    try {
      const result = await api.simulateSlotAllocation(pointId);
      setSimulationResult(result);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!user) {
      alert('Please log in or click Driver Demo in the top bar to join the queue.');
      return;
    }
    if (!targetPointId) return;

    setJoinLoading(true);
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      await api.joinWaitingList({
        chargingPointId: targetPointId,
        requestedStartTime: now.toISOString(),
        requestedEndTime: end.toISOString(),
        stateOfChargePercent: socInput,
      });
      setIsJoinModalOpen(false);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to join queue.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Research Algorithm & Decision System</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Smart Waiting List & Priority Allocation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Dynamic, multi-criteria slot reallocation when reservations are cancelled or forfeited.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            + Join Queue with Custom SOC
          </button>
          <button
            onClick={handleSimulateAllocation}
            disabled={simulating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {simulating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Simulate Slot Release & Allocate</span>
          </button>
        </div>
      </div>

      {/* Methodology & Formula Visual Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              System Methodology Specification
            </span>
            <h2 className="text-lg font-bold text-white">Mathematical Priority Formulation</h2>
          </div>
          <span className="font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-emerald-300">
            α + β + γ = 0.50 + 0.30 + 0.20 = 1.00
          </span>
        </div>

        {/* KaTeX / Math Expression Container */}
        <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 text-center space-y-2">
          <div className="text-lg sm:text-2xl font-mono font-bold text-emerald-400 tracking-wider">
            Pᵢ = 0.50 · Uᵢ + 0.30 · Tᵢ + 0.20 · Rᵢ
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Where <strong>Uᵢ = 1 − SOCᵢ</strong> represents battery depletion urgency, <strong>Tᵢ = min(wait/60, 1.0)</strong> represents queue time, and <strong>Rᵢ</strong> represents driver reliability.
          </p>
        </div>

        {/* 3 Parameter Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-emerald-400">α = 0.50: State of Charge Urgency</span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">50%</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Vehicles with lower battery SOC receive critical priority to avoid stranding on highway or transit corridors.
            </p>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sky-400">β = 0.30: Elapsed Wait Duration</span>
              <span className="bg-sky-950 text-sky-300 px-2 py-0.5 rounded font-mono font-bold">30%</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Waiting time accumulates proportionally up to 60 minutes to prevent starvation of moderately discharged vehicles.
            </p>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-400">γ = 0.20: Historical Reliability</span>
              <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">20%</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Derived from driver arrival record. Verified on-time sessions maintain 1.0 score, while no-shows incur penalties.
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Result Notification Banner */}
      {simulationResult && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-emerald-950 text-base">
                Simulated Slot Release & Allocation Execution Complete!
              </h3>
            </div>
            <button
              onClick={() => setSimulationResult(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-emerald-900 leading-relaxed">
            {simulationResult.message}
          </p>

          {simulationResult.selectedCandidate && (
            <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>Selected Winner: {simulationResult.selectedCandidate.userName}</span>
                <span className="text-emerald-700 font-mono text-sm">
                  Priority Score: {simulationResult.selectedCandidate.totalPriorityScore}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                <div>Battery SOC: <strong>{simulationResult.selectedCandidate.socPercent}%</strong></div>
                <div>Urgency Component (0.50 × U): <strong>{simulationResult.selectedCandidate.urgencyComponent}</strong></div>
                <div>Wait Component (0.30 × T): <strong>{simulationResult.selectedCandidate.waitingTimeComponent}</strong></div>
                <div>Reliability Component (0.20 × R): <strong>{simulationResult.selectedCandidate.reliabilityComponent}</strong></div>
              </div>
              {simulationResult.bookingReference && (
                <div className="text-[11px] font-mono text-emerald-700 pt-1 border-t border-slate-100">
                  Created Reservation: <strong>{simulationResult.bookingReference}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Waiting List Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Active Queue (Greater Noida Terminals)</h2>
            <p className="text-xs text-slate-500">
              Ranked dynamically by descending priority score Pᵢ. Real-time timestamps computed via PostgreSQL.
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Calculating real-time priority weights...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No drivers are currently queued in the waiting list.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Driver & Target Hub</th>
                  <th className="py-3 px-4">Battery SOC%</th>
                  <th className="py-3 px-4">Elapsed Wait</th>
                  <th className="py-3 px-4">Reliability (R)</th>
                  <th className="py-3 px-4">Calculated Pᵢ</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry, idx) => {
                  const isQueued = entry.status === 'QUEUED';
                  const isAllocated = entry.status === 'ALLOCATED';

                  return (
                    <tr
                      key={entry.id}
                      className={isAllocated ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isQueued ? (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs">
                            #{idx + 1}
                          </span>
                        ) : (
                          <span className="text-emerald-600">✓</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{entry.userName}</div>
                        <div className="text-[11px] text-slate-500">
                          {entry.stationName} ({entry.pointCode})
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              style={{ width: `${entry.stateOfChargePercent}%` }}
                              className={`h-full ${
                                entry.stateOfChargePercent < 20
                                  ? 'bg-red-500'
                                  : entry.stateOfChargePercent < 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <span className="font-semibold text-slate-800">
                            {entry.stateOfChargePercent}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          U = {(1 - entry.stateOfChargePercent / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {entry.priorityBreakdown?.waitingMinutes ?? 30} mins
                        </div>
                        <span className="text-[10px] text-slate-400">
                          T = {entry.priorityBreakdown?.waitingT ?? 0.5}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {entry.reliabilityScore.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                          {entry.priorityScore.toFixed(4)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          0.50U + 0.30T + 0.20R
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAllocated
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isQueued
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Join Waiting List Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Add Candidate to Smart Waiting List"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Submit an entry to demonstrate how varying battery SOC% and elapsed time alter the priority rankings in real-time.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Charging Station & Point</label>
            <select
              value={targetPointId || ''}
              onChange={(e) => setTargetPointId(parseInt(e.target.value, 10))}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50/50"
            >
              {stations.map((s) => (
                <optgroup key={s.id} label={s.name}>
                  {s.chargingPoints?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.pointCode} ({p.connectorType} - {p.powerKw} kW)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Vehicle Battery State of Charge: <strong>{socInput}%</strong>
            </label>
            <input
              type="range"
              min="5"
              max="95"
              value={socInput}
              onChange={(e) => setSocInput(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5% (High Urgency U=0.95)</span>
              <span>50%</span>
              <span>95% (Low Urgency U=0.05)</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div className="font-bold text-slate-900">Projected Instant Priority:</div>
            <div>
              P = 0.50 · {(1 - socInput / 100).toFixed(2)} + 0.30 · 0.00 + 0.20 · 0.95 ={' '}
              <strong className="text-emerald-700">
                {(0.5 * (1 - socInput / 100) + 0.2 * 0.95).toFixed(4)}
              </strong>
            </div>
          </div>

          <button
            onClick={handleJoinQueue}
            disabled={joinLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
          >
            {joinLoading ? 'Adding...' : 'Add to Queue'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

