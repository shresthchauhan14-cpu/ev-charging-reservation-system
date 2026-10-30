import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, BatteryCharging, Sparkles, X, ArrowRight } from 'lucide-react';

interface EVChargingAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  targetStationName?: string;
}

export const EVChargingAnimation: React.FC<EVChargingAnimationProps> = ({
  isOpen,
  onClose,
  onComplete,
  targetStationName = 'Greater Noida EV Grid',
}) => {
  const [stage, setStage] = useState<'attaching' | 'energizing' | 'charging' | 'complete'>('attaching');
  const [soc, setSoc] = useState(48);
  const [powerKw, setPowerKw] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStage('attaching');
      setSoc(48);
      setPowerKw(0);
      return;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Stage 1: Connector Attachment (0 - 400ms)
    const t1 = setTimeout(() => {
      setStage('energizing');
      setPowerKw(60);
    }, 450);

    // Stage 2: Electric Energy Pulse & Charger Light-Up (450 - 1100ms)
    const t2 = setTimeout(() => {
      setStage('charging');
      setPowerKw(120);
      setSoc(74);
    }, 1100);

    // Stage 3: Charging percentage saturation (1100 - 1700ms)
    const t3 = setTimeout(() => {
      setSoc(85);
      setStage('complete');
    }, 1750);

    // Stage 4: Smooth transition to station discovery (2300ms)
    const t4 = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-emerald-500/30 p-8 shadow-2xl shadow-emerald-950/50 text-white overflow-hidden">
        {/* Subtle Background Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header with Skip Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>VoltReserve Ultra-Charge Simulation</span>
          </div>
          <button
            onClick={onComplete}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Animated SVG Rig: Charger, Cable, Connector & EV Port */}
        <div className="relative py-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-md h-48 relative flex items-center justify-between px-6">
            
            {/* Charger Pillar Visual */}
            <div className="relative flex flex-col items-center">
              <div className={`w-20 h-36 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-between p-2.5 ${
                stage !== 'attaching' 
                  ? 'bg-slate-800/90 border-emerald-400 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20' 
                  : 'bg-slate-850 border-slate-700'
              }`}>
                {/* Station Screen */}
                <div className="w-full bg-slate-950 rounded-lg p-1.5 flex flex-col items-center border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">DC RAPID</div>
                  <div className={`text-xs font-bold font-mono transition-colors ${stage !== 'attaching' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {powerKw} kW
                  </div>
                </div>

                {/* Glowing Circular LED Status Ring */}
                <div className="relative flex items-center justify-center my-auto">
                  <div className={`w-8 h-8 rounded-full transition-all duration-500 flex items-center justify-center ${
                    stage !== 'attaching' 
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-400 animate-pulse' 
                      : 'bg-blue-600/60'
                  }`}>
                    <Zap className="w-4 h-4 text-white fill-current" />
                  </div>
                  {stage !== 'attaching' && (
                    <div className="absolute inset-0 rounded-full border border-emerald-400/50 animate-ping" />
                  )}
                </div>

                <div className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold">
                  VoltPoint
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-medium">150kW Hub</div>
            </div>

            {/* Dynamic Animated High-Voltage Flexible Cable */}
            <div className="flex-1 relative h-24 mx-2 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 80">
                <defs>
                  {/* Energy Flow Gradient */}
                  <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>

                  {/* Pulsing Energy Glow Filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Base Rubberized Cable Path */}
                <path
                  d="M 10 40 C 60 75, 140 10, 190 40"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Animated Flowing Energy Particle Stream */}
                {stage !== 'attaching' && (
                  <path
                    d="M 10 40 C 60 75, 140 10, 190 40"
                    fill="none"
                    stroke="url(#energyGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                    className="animate-[dash_1s_linear_infinite]"
                    filter="url(#glow)"
                  />
                )}
              </svg>
            </div>

            {/* Vehicle Inlet / Charging Port Visual */}
            <div className="relative flex flex-col items-center">
              <div className={`w-20 h-36 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-between p-2.5 ${
                stage === 'charging' || stage === 'complete'
                  ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-850 border-slate-700'
              }`}>
                {/* Vehicle Port Battery Display */}
                <div className="w-full bg-slate-950 rounded-lg p-1.5 flex flex-col items-center border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">BATTERY</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {soc}%
                  </div>
                </div>

                {/* Connector Docked Graphic */}
                <div className="relative flex items-center justify-center my-auto">
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    stage !== 'attaching'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 scale-105'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    <BatteryCharging className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold">
                  EV Port
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-medium">CCS2 Port</div>
            </div>

          </div>

          {/* Progress / Status HUD Bar */}
          <div className="w-full max-w-sm mt-4 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  stage === 'complete' ? 'bg-emerald-400' : 'bg-emerald-500 animate-ping'
                }`} />
                {stage === 'attaching' && 'Locking CCS2 Connector to EV Port...'}
                {stage === 'energizing' && 'Handshaking BMS & Energizing Bus...'}
                {stage === 'charging' && 'Ultra-Fast Liquid Cooled Charging...'}
                {stage === 'complete' && 'Slot Verified • Launching Discovery Hub'}
              </span>
              <span className="font-mono font-bold text-emerald-400">{soc}%</span>
            </div>

            {/* Glowing Linear Gauge */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 shadow-sm shadow-emerald-400"
                style={{ width: `${soc}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>{targetStationName}</span>
              <span className="font-mono text-cyan-300">ACID Concurrency Protected</span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="text-center pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time availability confirmed • Seamless redirecting...</span>
        </div>
      </div>
    </div>
  );
};
