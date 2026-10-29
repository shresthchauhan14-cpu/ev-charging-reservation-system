import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Zap,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  BatteryCharging,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { ChargingStation, ChargingPoint } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const StationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [station, setStation] = useState<ChargingStation | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState<string>('14:00');
  const [durationMins, setDurationMins] = useState<number>(60);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Booking confirmation modal & error state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<any | null>(null);

  // Waiting list modal state
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistSoc, setWaitlistSoc] = useState<number>(20);
  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getStationById(parseInt(id, 10))
      .then((data) => {
        setStation(data);
        if (data.chargingPoints && data.chargingPoints.length > 0) {
          setSelectedPointId(data.chargingPoints[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Check live interval availability whenever date, hour, or duration changes
  useEffect(() => {
    if (!id || !bookingDate || !startHour) return;

    const [hours, minutes] = startHour.split(':').map(Number);
    const start = new Date(`${bookingDate}T${startHour}:00`);
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    setCheckingAvailability(true);
    api
      .getStationAvailability(parseInt(id, 10), start.toISOString(), end.toISOString())
      .then((res) => {
        setAvailabilityData(res);
      })
      .catch(console.error)
      .finally(() => setCheckingAvailability(false));
  }, [id, bookingDate, startHour, durationMins]);

  if (loading || !station) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading station details from database...</p>
      </div>
    );
  }

  const selectedPoint = station.chargingPoints?.find((p) => p.id === selectedPointId);
  const pointAvailability = availabilityData?.chargingPoints?.find(
    (p: any) => p.chargingPointId === selectedPointId
  );
  const isSlotAvailable = pointAvailability?.isAvailableForInterval ?? true;

  // Compute estimated cost
  const durationHours = durationMins / 60;
  const powerKw = selectedPoint?.powerKw || 60;
  const pricePerKwh = selectedPoint?.pricePerKwh || 16.5;
  const estimatedEnergy = Math.round(powerKw * durationHours * 0.85 * 10) / 10;
  const estimatedCost = Math.round(estimatedEnergy * pricePerKwh);

  const handleBookSlot = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedPointId) return;

    setBookingLoading(true);
    setBookingError(null);

    const start = new Date(`${bookingDate}T${startHour}:00`);
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    try {
      const resv = await api.createReservation({
        chargingPointId: selectedPointId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      setConfirmedReservation(resv);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleJoinWaitingList = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedPointId) return;

    const start = new Date(`${bookingDate}T${startHour}:00`);
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    try {
      const entry = await api.joinWaitingList({
        chargingPointId: selectedPointId,
        requestedStartTime: start.toISOString(),
        requestedEndTime: end.toISOString(),
        stateOfChargePercent: waitlistSoc,
      });
      setWaitlistSuccess(`Successfully added to waiting list! Initial Priority Score: ${entry.priorityScore}`);
      setTimeout(() => {
        setIsWaitlistModalOpen(false);
        setWaitlistSuccess(null);
        navigate('/waiting-list');
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/stations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Stations</span>
      </Link>

      {/* Station Title Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{station.operatingStatus}</span>
            </span>
            <span className="text-xs text-slate-500">
              Operating Hours: {station.openingTime.slice(0, 5)} - {station.closingTime.slice(0, 5)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{station.name}</h1>
          <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{station.address}, {station.city}, {station.state} - {station.postalCode}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="text-center px-2">
            <div className="text-lg font-bold text-slate-900">{station.chargingPoints?.length || 0}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Dispensers</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center px-2">
            <div className="text-lg font-bold text-emerald-600">
              {station.chargingPoints?.filter((p) => p.operationalStatus === 'AVAILABLE').length || 0}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Available Now</div>
          </div>
        </div>
      </div>

      {/* Main Booking Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Charging Points Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">1. Select a Charging Point</h2>
              <span className="text-xs text-slate-500">Click a dispenser to inspect</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {station.chargingPoints?.map((point) => {
                const isSelected = selectedPointId === point.id;
                const isOut = point.operationalStatus === 'OUT_OF_SERVICE';

                return (
                  <div
                    key={point.id}
                    onClick={() => !isOut && setSelectedPointId(point.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isOut
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                        : isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Zap className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{point.pointCode}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isOut
                            ? 'bg-red-50 text-red-700'
                            : point.operationalStatus === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {point.operationalStatus}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {point.connectorType}
                      </span>
                      <span className="font-bold text-emerald-700">{point.powerKw} kW</span>
                      <span className="text-slate-500">₹{point.pricePerKwh}/kWh</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Station Amenities & Information */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900 text-sm">Station Facilities & Guidelines</h3>
            <p className="leading-relaxed">{station.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center font-medium">
                ☕ Driver Lounge
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center font-medium">
                📶 Campus Wi-Fi
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center font-medium">
                🛡️ 24x7 Security
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center font-medium">
                ⏱️ 15m Grace Period
              </div>
            </div>
          </div>
        </div>

        {/* Right: Date/Time Interval & Booking Confirmation Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">2. Configure Date & Slot</h2>
              <p className="text-xs text-slate-500">PostgreSQL validates overlapping reservations in real-time</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reservation Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                  >
                    {[
                      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
                      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                      '18:00', '19:00', '20:00', '21:00', '22:00',
                    ].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    value={durationMins}
                    onChange={(e) => setDurationMins(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins (1 hr)</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins (2 hrs)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Interval Availability Status Indicator */}
            <div className="pt-2">
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  isSlotAvailable
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}
              >
                {isSlotAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {isSlotAvailable
                      ? `Slot Available: ${selectedPoint?.pointCode}`
                      : `Slot Occupied / Reserved`}
                  </div>
                  <div className="text-[11px] mt-0.5 text-slate-600">
                    {isSlotAvailable
                      ? `${bookingDate} from ${startHour} to ${new Date(
                          new Date(`${bookingDate}T${startHour}:00`).getTime() + durationMins * 60 * 1000
                        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} is unreserved in PostgreSQL.`
                      : `Another driver holds a reservation during this window. You can join the Smart Waiting List.`}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Summary Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Power Delivery</span>
                <span className="font-semibold text-slate-800">{powerKw} kW ({selectedPoint?.connectorType})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Energy</span>
                <span className="font-semibold text-slate-800">~{estimatedEnergy} kWh</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tariff Rate</span>
                <span className="font-semibold text-slate-800">₹{pricePerKwh}/kWh</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Estimated Total</span>
                <span className="text-emerald-700">₹{estimatedCost}</span>
              </div>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {bookingError}
              </div>
            )}

            {/* Action Buttons */}
            {isSlotAvailable ? (
              <button
                onClick={handleBookSlot}
                disabled={bookingLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {bookingLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Confirm Slot Reservation</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setIsWaitlistModalOpen(true)}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Join Smart Waiting List</span>
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  Priority formula evaluates your battery SOC% if the slot is cancelled or no-showed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmedReservation && (
        <Modal
          isOpen={true}
          onClose={() => {
            setConfirmedReservation(null);
            navigate('/my-bookings');
          }}
          title="Reservation Confirmed!"
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Booking Reference</div>
              <div className="font-mono text-lg font-extrabold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200 inline-block">
                {confirmedReservation.booking_reference}
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Your charging slot at <strong>{station.name}</strong> ({selectedPoint?.pointCode}) has been safely locked in the PostgreSQL database.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(confirmedReservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Power:</span>
                <span className="font-semibold text-slate-800">{powerKw} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Cost:</span>
                <span className="font-semibold text-emerald-700">₹{confirmedReservation.estimated_cost}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/my-bookings"
                className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm"
              >
                View in My Bookings
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Waiting List Modal */}
      <Modal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        title="Join Smart Waiting List"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Enter your vehicle's State of Charge (SOC%). The research algorithm gives higher scheduling priority to vehicles with lower charge and longer waiting times.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Battery State of Charge (SOC%): {waitlistSoc}%
            </label>
            <input
              type="range"
              min="5"
              max="90"
              value={waitlistSoc}
              onChange={(e) => setWaitlistSoc(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5% (High Urgency U=0.95)</span>
              <span>50%</span>
              <span>90% (Low Urgency U=0.10)</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
            <div>Urgency Component (α=0.50): {(0.5 * (1 - waitlistSoc / 100)).toFixed(3)}</div>
            <div>Wait Time Weight (β=0.30): Dynamically accumulates</div>
            <div>Driver Reliability (γ=0.20): 0.200 (Default)</div>
          </div>

          {waitlistSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-center font-semibold">
              {waitlistSuccess}
            </div>
          )}

          <button
            onClick={handleJoinWaitingList}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
          >
            Submit to Queue
          </button>
        </div>
      </Modal>
    </div>
  );
};

