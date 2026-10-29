import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('UPCOMING');

  // Cancel reservation modal
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelNotification, setCancelNotification] = useState<any | null>(null);

  // Check-in modal
  const [ticketModal, setTicketModal] = useState<Reservation | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getReservations();
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const handleCancelReservation = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await api.cancelReservation(cancelTarget.id, cancelReason);
      setCancelNotification(result);
      fetchBookings();
      setTimeout(() => {
        setCancelTarget(null);
        setCancelReason('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckIn = async (resvId: number) => {
    try {
      await api.checkInReservation(resvId);
      alert('Checked in successfully! Charging session initiated.');
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Check-in failed.');
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (activeTab === 'UPCOMING') return r.status === 'CONFIRMED' || r.status === 'CHECKED_IN';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return r.status === 'CANCELLED' || r.status === 'NO_SHOW';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Reservations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track confirmed slots, cancel upcoming sessions, and check in at Greater Noida terminals.
          </p>
        </div>
        <Link
          to="/stations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Book Another Slot</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['UPCOMING', 'COMPLETED', 'CANCELLED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Querying your booking history...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No {activeTab.toLowerCase()} reservations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any bookings in this view. Browse charging hubs to reserve an available time interval.
          </p>
          <Link
            to="/stations"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            <span>Explore Stations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((resv) => {
            const isConfirmed = resv.status === 'CONFIRMED';
            const isCheckedIn = resv.status === 'CHECKED_IN';
            const isCancelled = resv.status === 'CANCELLED';

            return (
              <div
                key={resv.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                      {resv.bookingReference}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCheckedIn
                          ? 'bg-blue-100 text-blue-800'
                          : isCancelled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {resv.status}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Booked on {new Date(resv.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{resv.stationName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{resv.stationAddress}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Dispenser</span>
                      <span className="font-semibold text-slate-800">{resv.pointCode} ({resv.connectorType})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Power Rating</span>
                      <span className="font-semibold text-emerald-700">{resv.powerKw} kW</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Time Window</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(resv.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(resv.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Estimated Bill</span>
                      <span className="font-bold text-slate-900">₹{resv.estimatedCost}</span>
                    </div>
                  </div>

                  {resv.cancellationReason && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                      Cancellation Reason: {resv.cancellationReason}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex md:flex-col items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isConfirmed && (
                    <>
                      <button
                        onClick={() => handleCheckIn(resv.id)}
                        className="flex-1 md:w-40 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Check-In at Hub
                      </button>
                      <button
                        onClick={() => setTicketModal(resv)}
                        className="flex-1 md:w-40 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View QR Ticket</span>
                      </button>
                      <button
                        onClick={() => setCancelTarget(resv)}
                        className="flex-1 md:w-40 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-xs border border-red-200 transition-colors cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}

                  {isCheckedIn && (
                    <div className="text-center md:w-40 p-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs border border-blue-200">
                      ⚡ Session in Progress
                    </div>
                  )}

                  {isCancelled && (
                    <div className="text-center md:w-40 p-2 bg-slate-100 text-slate-500 font-medium rounded-xl text-xs">
                      Slot Released
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Reservation Modal */}
      {cancelTarget && (
        <Modal
          isOpen={true}
          onClose={() => setCancelTarget(null)}
          title="Confirm Reservation Cancellation"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Intelligent Reallocation Notice:</strong> Cancelling this slot ({cancelTarget.pointCode} at {cancelTarget.stationName}) will immediately release it back to the database. The system will automatically evaluate the Smart Waiting List and assign it to the driver with the highest priority score!
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule change, reached alternate charger..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs"
                rows={3}
              />
            </div>

            {cancelNotification && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold">{cancelNotification.message}</div>
                {cancelNotification.data?.reallocatedToWaitingList && (
                  <div className="text-[11px] text-emerald-700">
                    ✨ Slot was immediately reallocated to waiting driver: {cancelNotification.data.reallocationDetails?.selectedCandidate?.userName}!
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelReservation}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
              >
                {cancelling ? 'Releasing Slot...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Ticket Modal */}
      {ticketModal && (
        <Modal
          isOpen={true}
          onClose={() => setTicketModal(null)}
          title="Terminal Check-In QR Pass"
        >
          <div className="text-center space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl inline-block shadow-sm">
              <div className="w-48 h-48 bg-slate-900 text-white p-3 rounded-lg flex flex-col justify-between items-center font-mono text-[9px]">
                <div className="w-full flex justify-between">
                  <div className="w-10 h-10 border-4 border-white" />
                  <div className="w-10 h-10 border-4 border-white" />
                </div>
                <div className="text-center text-emerald-400 font-bold">
                  {ticketModal.bookingReference}
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-10 h-10 border-4 border-white" />
                  <div className="text-slate-400">IILM-EV</div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">{ticketModal.stationName}</div>
              <div className="text-[11px] text-slate-500">
                Dispenser: {ticketModal.pointCode} • Scheduled:{' '}
                {new Date(ticketModal.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

