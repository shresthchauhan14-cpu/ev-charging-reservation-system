import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Car,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Reservation, ChargingStation } from '../types';
import { Modal } from '../components/common/Modal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    Promise.all([api.getReservations(), api.getStations()])
      .then(([resvs, stns]) => {
        setReservations(resvs);
        setStations(stns);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const upcomingReservations = reservations.filter(
    (r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'
  );
  const completedReservations = reservations.filter((r) => r.status === 'COMPLETED');
  const cancelledReservations = reservations.filter(
    (r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW'
  );

  const nextBooking = upcomingReservations[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-200">
            Driver Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Active driver profile connected to Greater Noida EV infrastructure. Manage your bookings and inspect intelligent waiting-list priority allocations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/stations"
            className="px-4 py-2.5 bg-white text-emerald-900 font-bold rounded-xl text-xs shadow-md hover:bg-emerald-50 transition-colors"
          >
            Find a Station
          </Link>
          <Link
            to="/my-bookings"
            className="px-4 py-2.5 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs border border-emerald-500/40 transition-colors"
          >
            My Bookings
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Total Bookings</div>
          <div className="text-2xl font-black text-slate-900">{reservations.length}</div>
          <div className="text-[10px] text-slate-400">Recorded in PostgreSQL</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Upcoming Slots</div>
          <div className="text-2xl font-black text-emerald-600">{upcomingReservations.length}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Active reservations</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Completed Sessions</div>
          <div className="text-2xl font-black text-blue-600">{completedReservations.length}</div>
          <div className="text-[10px] text-slate-400">Finished charging</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Cancelled / No-Show</div>
          <div className="text-2xl font-black text-amber-600">{cancelledReservations.length}</div>
          <div className="text-[10px] text-slate-400">Reallocated to waitlist</div>
        </div>
      </div>

      {/* Main Grid: Upcoming Reservation Highlight + Live Stations Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Next Upcoming Booking Highlight */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Next Scheduled Charging Session</h2>
                <p className="text-xs text-slate-500">Live booking ticket with check-in validation</p>
              </div>
              {nextBooking && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {nextBooking.bookingReference}
                </span>
              )}
            </div>

            {nextBooking ? (
              <div className="space-y-4">
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{nextBooking.stationName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{nextBooking.stationAddress}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                      {nextBooking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100/60 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Dispenser</div>
                      <div className="font-semibold text-slate-800">{nextBooking.pointCode} ({nextBooking.connectorType})</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Start Time</div>
                      <div className="font-semibold text-slate-800">
                        {new Date(nextBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Estimated Cost</div>
                      <div className="font-semibold text-emerald-700">₹{nextBooking.estimatedCost}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTicket(nextBooking)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show Check-In QR Pass</span>
                  </button>
                  <Link
                    to="/my-bookings"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No Active Upcoming Reservations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You currently have no confirmed charging slots booked. Discover stations across Greater Noida and book a guaranteed window.
                </p>
                <Link
                  to="/stations"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                >
                  <span>Book a Slot Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Station Availability Glance */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Greater Noida Stations Overview</h2>
              <Link to="/stations" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {stations.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">{s.name}</div>
                    <div className="text-[11px] text-slate-500">Max {s.maxPowerKw} kW • ₹{s.minPricePerKwh}/kWh</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {s.availablePoints}/{s.totalPoints} Free
                    </span>
                    <Link
                      to={`/stations/${s.id}`}
                      className="block text-[10px] font-semibold text-emerald-600 hover:underline mt-0.5"
                    >
                      Book →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QR Ticket Modal */}
      {activeTicket && (
        <Modal
          isOpen={true}
          onClose={() => setActiveTicket(null)}
          title="Terminal Check-In QR Pass"
        >
          <div className="text-center space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl inline-block shadow-sm">
              {/* Simulated QR Code SVG */}
              <div className="w-48 h-48 bg-slate-900 text-white p-3 rounded-lg flex flex-col justify-between items-center font-mono text-[9px]">
                <div className="w-full flex justify-between">
                  <div className="w-10 h-10 border-4 border-white" />
                  <div className="w-10 h-10 border-4 border-white" />
                </div>
                <div className="text-center text-emerald-400 font-bold">
                  {activeTicket.bookingReference}
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-10 h-10 border-4 border-white" />
                  <div className="text-slate-400">IILM-EV</div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">{activeTicket.stationName}</div>
              <div className="text-[11px] text-slate-500">
                Dispenser: {activeTicket.pointCode} • Scheduled: {new Date(activeTicket.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Present this pass at the terminal scanner within the 15-minute grace window.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

