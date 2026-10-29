import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Database, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Project Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-bold text-white text-base">VoltReserve</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              EV Charging Reservation & Real-Time Availability System. Designed for intelligent slot scheduling and priority-driven waiting list reallocation.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>PostgreSQL Concurrency Protected</span>
            </div>
          </div>

          {/* Academic Attribution */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Academic Project</h4>
            <div className="text-xs space-y-1.5">
              <p className="text-slate-300 font-medium">IILM University, Greater Noida</p>
              <p className="text-slate-400">Department of Computer Science & Engineering</p>
              <p className="text-slate-400">Degree: B.Tech CSE</p>
              <p className="text-emerald-400 font-medium">Phase I: Functional System Prototype</p>
            </div>
          </div>

          {/* System Links */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/stations" className="hover:text-emerald-400 transition-colors">
                  Find Charging Stations
                </Link>
              </li>
              <li>
                <Link to="/waiting-list" className="hover:text-emerald-400 transition-colors">
                  Smart Waiting List Engine
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  How the System Works
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-400 transition-colors">
                  Administrator Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Demonstration Notice */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Project Notice</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This system is an academic engineering prototype. Charging stations, slot availability, and priority allocations are recorded in a PostgreSQL database engine for evaluation purposes.
            </p>
            <div className="pt-2 flex gap-4 text-xs">
              <Link to="/privacy" className="hover:text-slate-200">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-slate-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-center text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>© {new Date().getFullYear()} EV Charging Reservation System — IILM University, Greater Noida. All rights reserved.</div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academic Demonstration Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

