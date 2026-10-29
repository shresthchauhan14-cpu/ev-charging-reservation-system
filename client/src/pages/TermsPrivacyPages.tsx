import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Academic Prototype Notice — IILM University, Greater Noida</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900">1. Nature of the System</h2>
          <p>
            This web application is an academic functional prototype engineered for the B.Tech Computer Science and Engineering Major Project at IILM University, Greater Noida. All user records, vehicle information, and charging stations are demonstration records stored for evaluation.
          </p>

          <h2 className="text-sm font-bold text-slate-900">2. Data Security & Storage</h2>
          <p>
            Driver authentication passwords are encrypted using one-way bcrypt hashing. No plaintext credentials or secrets are exposed to client-side code. Session authentication uses JSON Web Tokens (JWT).
          </p>

          <h2 className="text-sm font-bold text-slate-900">3. Waiting List Algorithm Telemetry</h2>
          <p>
            When joining the smart waiting list, driver State of Charge (SOC%) and arrival timestamps are utilized solely to calculate priority weights according to the documented formulation (Pᵢ = 0.50·Uᵢ + 0.30·Tᵢ + 0.20·Rᵢ).
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-500">Academic Evaluation Terms — Phase I Prototype</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900">1. Prototype Reservation Policy</h2>
          <p>
            Reservations made on this platform represent database allocations within the simulated Greater Noida charging network. Confirmed slots are held subject to a default 15-minute check-in grace period.
          </p>

          <h2 className="text-sm font-bold text-slate-900">2. Slot Reallocation & Forfeiture</h2>
          <p>
            If a driver fails to check in before the expiration of the grace period or submits a cancellation, the system marks the reservation as NO_SHOW or CANCELLED, immediately releasing the slot to the highest-priority driver in the waiting queue.
          </p>

          <h2 className="text-sm font-bold text-slate-900">3. Institutional Attribution</h2>
          <p>
            Developed by Department of Computer Science and Engineering, IILM University, Greater Noida.
          </p>
        </div>
      </div>
    </div>
  );
};

