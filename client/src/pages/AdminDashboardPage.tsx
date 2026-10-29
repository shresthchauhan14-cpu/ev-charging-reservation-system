import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Layers,
  Zap,
  RotateCcw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Users,
  Clock,
  Database,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { AdminMetrics, ChargingStation, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STATIONS' | 'RESERVATIONS' | 'ANALYTICS'>('OVERVIEW');

  // New station modal
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Greater Noida',
    latitude: 28.47,
    longitude: 77.50,
  });

  // Reset database modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dash, stns, resvs, anly] = await Promise.all([
        api.getAdminDashboard(),
        api.getStations(),
        api.getReservations(undefined, true),
        api.getAnalytics(),
      ]);
      setMetrics(dash.metrics);
      setStations(stns);
      setReservations(resvs);
      setAnalytics(anly);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      alert('Access restricted to administrators.');
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStation(newStation);
      setIsStationModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create station.');
    }
  };

  const handleSimulateNoShow = async (resvId: number) => {
    if (!confirm('Simulate no-show for this reservation? The slot will be released and evaluated against the waiting list.')) {
      return;
    }
    try {
      const res = await api.simulateNoShow(resvId);
      alert(res.message);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Simulation failed.');
    }
  };

  const handleUpdatePointStatus = async (pointId: number, status: string) => {
    try {
      await api.updateChargingPoint(pointId, { operationalStatus: status });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Update failed.');
    }
  };

  const handleResetDatabase = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await api.resetDemoData();
      setResetMessage(res.message);
      fetchAdminData();
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetMessage(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading administrator console from PostgreSQL...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200 mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Administrator Control Console</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Infrastructure Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time telemetry, station provisioning, and no-show dispute handling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Station</span>
          </button>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl text-xs border border-red-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Database</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['OVERVIEW', 'STATIONS', 'RESERVATIONS', 'ANALYTICS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'OVERVIEW' && metrics && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Total Stations</div>
              <div className="text-2xl font-black text-slate-900">{metrics.totalStations}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Dispensers</div>
              <div className="text-2xl font-black text-slate-900">{metrics.totalChargingPoints}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Available Now</div>
              <div className="text-2xl font-black text-emerald-600">{metrics.availableChargingPoints}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Active Bookings</div>
              <div className="text-2xl font-black text-blue-600">{metrics.activeReservations}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Cancelled / No-Show</div>
              <div className="text-2xl font-black text-amber-600">
                {metrics.cancelledReservations + metrics.noShowReservations}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Waiting List Queue</div>
              <div className="text-2xl font-black text-purple-600">{metrics.waitingListEntries}</div>
            </div>
          </div>

          {/* Quick Actions & Stations Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Station Hubs Telemetry</h3>
              <div className="space-y-3">
                {stations.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-slate-500 text-[11px]">{s.address}</div>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {s.availablePoints}/{s.totalPoints} Available
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Database Concurrency Status</h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    PostgreSQL 16 ACID transactions and interval overlap checking active.
                  </span>
                </div>
                <div className="p-3 bg-purple-50 text-purple-900 rounded-xl border border-purple-200 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>
                    No-Show Grace Period configured at <strong>15 minutes</strong>. Automatic slot reallocation enabled.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATIONS MANAGEMENT */}
      {activeTab === 'STATIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900">Manage Charging Stations & Points</h2>
            <div className="space-y-6">
              {stations.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.address}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                      Status: {s.operatingStatus}
                    </span>
                  </div>

                  {/* Charging Points for this Station */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Charging Points</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {s.chargingPoints?.map((p) => (
                        <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center font-bold text-slate-900">
                            <span>{p.pointCode}</span>
                            <span className="text-emerald-700">{p.powerKw} kW</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.connectorType} • ₹{p.pricePerKwh}/kWh
                          </div>
                          <div>
                            <select
                              value={p.operationalStatus}
                              onChange={(e) => handleUpdatePointStatus(p.id, e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-300 text-[11px] bg-slate-50 font-semibold"
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="OCCUPIED">OCCUPIED</option>
                              <option value="RESERVED">RESERVED</option>
                              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESERVATIONS OVERVIEW */}
      {activeTab === 'RESERVATIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">System Reservations & No-Show Disputes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Station / Dispenser</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.bookingReference}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.userName || r.userEmail}</td>
                    <td className="py-3 px-4">
                      {r.stationName} ({r.pointCode})
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleSimulateNoShow(r.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-semibold border border-amber-200 cursor-pointer"
                        >
                          Simulate No-Show
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Station Utilization */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Station Utilization Rates</h3>
              <div className="space-y-3">
                {analytics.stationUtilization?.map((item: any) => (
                  <div key={item.station_name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-800">
                      <span>{item.station_name}</span>
                      <span>{item.utilization_rate_percent || 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${item.utilization_rate_percent || 0}%` }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connector Demand */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Connector Standard Distribution</h3>
              <div className="space-y-3 text-xs">
                {analytics.connectorDemand?.map((c: any) => (
                  <div key={c.connector_type} className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">{c.connector_type}</span>
                    <span className="text-slate-500 font-semibold">{c.booking_count} bookings recorded</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Station Modal */}
      <Modal
        isOpen={isStationModalOpen}
        onClose={() => setIsStationModalOpen(false)}
        title="Add Greater Noida Charging Station"
      >
        <form onSubmit={handleCreateStation} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Station Name</label>
            <input
              type="text"
              required
              value={newStation.name}
              onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
              placeholder="e.g. Sector Beta-2 Charging Plaza"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              required
              value={newStation.address}
              onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
              placeholder="Full address in Greater Noida"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={newStation.description}
              onChange={(e) => setNewStation({ ...newStation, description: e.target.value })}
              placeholder="Available amenities, hours, power summary..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={newStation.latitude}
                onChange={(e) => setNewStation({ ...newStation, latitude: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={newStation.longitude}
                onChange={(e) => setNewStation({ ...newStation, longitude: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs"
          >
            Create Station Record
          </button>
        </form>
      </Modal>

      {/* Reset Demo Database Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Reset Demo Database"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <div>
              <strong>Action Notice:</strong> This operation drops all tables, re-applies PostgreSQL 16 migrations, and re-seeds clean Greater Noida stations, test users, vehicles, and waiting list records.
            </div>
          </div>

          {resetMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-semibold text-center">
              {resetMessage}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
            >
              {resetting ? 'Resetting Database...' : 'Confirm Reset'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

