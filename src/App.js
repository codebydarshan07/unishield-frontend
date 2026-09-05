import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Shield, Activity, AlertTriangle, Crosshair, 
  Layout, Terminal, Server, Cpu, 
  Target, CheckCircle2, ShieldAlert,
  Menu, X
} from 'lucide-react';

// --- SHARED MOCK DATA ---
const threatActivityData = [
  { time: '15:55', high: 4, medium: 12, low: 25 },
  { time: '16:05', high: 7, medium: 15, low: 30 },
  { time: '16:15', high: 2, medium: 22, low: 28 },
  { time: '16:25', high: 9, medium: 18, low: 35 },
  { time: '16:35', high: 14, medium: 25, low: 45 },
  { time: '16:45', high: 6, medium: 30, low: 38 },
  { time: '16:55', high: 11, medium: 20, low: 42 },
];

const threatDistribution = [
  { name: 'DGA / DNS', value: 31, color: '#9333ea' },
  { name: 'Port Scan', value: 24, color: '#6366f1' },
  { name: 'Beaconing', value: 19, color: '#4f46e5' },
  { name: 'DoS', value: 15, color: '#e11d48' },
  { name: 'Anomalous Flow', value: 11, color: '#8b5cf6' },
];

const overviewAlerts = [
  { id: 'EVT-9021', severity: 'CRITICAL', source: '10.24.18.42', dest: '10.24.1.10', detection: 'DGA / DNS Anomaly', conf: '98.2%', time: '16:52:31', model: 'Random Forest' },
  { id: 'EVT-9022', severity: 'HIGH', source: '10.24.21.17', dest: '10.24.1.0/24', detection: 'Port Scan', conf: '92.1%', time: '16:51:48', model: 'Heuristic + RF' },
  { id: 'EVT-9023', severity: 'HIGH', source: '10.24.19.08', dest: '198.51.100.4', detection: 'Beaconing', conf: '88.3%', time: '16:50:22', model: 'XGBoost FFT' },
  { id: 'EVT-9024', severity: 'MEDIUM', source: '10.24.14.63', dest: '10.24.0.53', detection: 'Anomalous Flow', conf: '81.4%', time: '16:49:57', model: 'Isolation Forest' },
  { id: 'EVT-9025', severity: 'MEDIUM', source: '10.24.22.91', dest: '10.24.0.53', detection: 'DNS Anomaly', conf: '79.9%', time: '16:48:36', model: 'CNN/LSTM' },
  { id: 'EVT-9026', severity: 'LOW', source: '10.24.8.19', dest: 'External', detection: 'Encrypted Payload', conf: '65.2%', time: '16:45:11', model: 'Autoencoder' },
  { id: 'EVT-9027', severity: 'LOW', source: '10.24.5.11', dest: 'External', detection: 'Mismatched Cert', conf: '61.8%', time: '16:42:05', model: 'JA3 Fingerprint' },
];

// --- HELPER FUNCTION ---
const getSeverityColor = (severity) => {
  switch(severity) {
    case 'CRITICAL': return 'bg-rose-500';
    case 'HIGH': return 'bg-orange-500';
    case 'MEDIUM': return 'bg-yellow-500';
    case 'LOW': return 'bg-slate-500';
    default: return 'bg-slate-500';
  }
};

// --- MAIN APPLICATION SHELL ---
export default function UniShieldDashboard() {
  const [pulse, setPulse] = useState(false);
  const [activePage, setActivePage] = useState('stream'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => setPulse(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-300 font-sans overflow-hidden selection:bg-purple-500/30">
      
      {/* GLOBAL TOP HEADER */}
      <header className="h-8 bg-[#02040a] border-b border-indigo-900/30 flex items-center justify-between px-3 md:px-4 shrink-0 font-mono text-[9px] md:text-[10px] text-slate-500 tracking-widest uppercase">
        <div className="flex items-center space-x-2 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="truncate">CLASSIFIED NETWORK MONITORING</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-rose-500/80 border border-rose-900/30 bg-rose-950/20 px-2 py-0.5 rounded-sm">
          <span>[ RESTRICTED ] CONFIDENTIAL</span>
        </div>
        <div>
          <span className="text-slate-400">05 SEP 2026</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* MOBILE MENU OVERLAY */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 z-20 md:hidden"
          ></div>
        )}

        {/* RESPONSIVE SIDEBAR */}
        <aside className={`
          absolute md:relative z-30 top-0 bottom-0 left-0 w-[280px] bg-[#060913] border-r border-indigo-900/30 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col">
            <div className="p-5 md:p-6 flex items-center justify-between border-b border-indigo-900/30 bg-[#04060d]">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 border border-indigo-500/30 bg-indigo-950/30 rounded">
                  <Shield className="text-purple-500 w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h1 className="text-sm md:text-base font-bold tracking-widest text-slate-100 uppercase">UniShield <span className="text-purple-500">AI</span></h1>
                  <span className="text-[9px] text-slate-500 tracking-widest font-mono uppercase block mt-0.5">PASSIVE DEFENSE</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-3 space-y-1 mt-2">
              <SidebarBtn icon={<Layout />} label="OVERVIEW" active={activePage === 'overview'} onClick={() => handleNavClick('overview')} />
              <SidebarBtn icon={<Activity />} label="LIVE THREAT STREAM" badge="6" pulse={pulse} active={activePage === 'stream'} onClick={() => handleNavClick('stream')} />
              <SidebarBtn icon={<Crosshair />} label="THREAT ANALYTICS" active={activePage === 'analytics'} onClick={() => handleNavClick('analytics')} />
              <SidebarBtn icon={<Terminal />} label="ZEEK CAPTURE LOGS" active={activePage === 'logs'} onClick={() => handleNavClick('logs')} />
              <SidebarBtn icon={<Server />} label="SENSOR TELEMETRY" active={activePage === 'telemetry'} onClick={() => handleNavClick('telemetry')} />
            </nav>
          </div>

          <div className="p-3 md:p-4 m-3 md:m-4 rounded border border-indigo-900/40 bg-[#0a0e1c] shrink-0">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-900/30 pb-1.5">
                <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest">Passive Ingest</span>
                <span className="text-[9px] font-mono text-emerald-500 border border-emerald-900/50 bg-emerald-950/20 px-1.5 py-0.5 rounded">[ RX ONLY ]</span>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-[11px] font-mono">
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Kafka Live
                </span>
                <span className="text-purple-400">18.4K/s</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#030712]">
          <header className="px-4 md:px-6 py-3 md:py-5 border-b border-indigo-900/30 flex items-center justify-between shrink-0 bg-[#060913]">
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded border border-indigo-900/50 bg-[#0a0f1c] text-purple-400">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base md:text-xl font-bold tracking-widest text-slate-100 uppercase truncate">
                  {activePage === 'overview' && 'EXECUTIVE SOC VIEW'}
                  {activePage === 'stream' && 'LIVE THREAT STREAM'}
                  {activePage === 'analytics' && 'THREAT ANALYTICS'}
                  {activePage === 'logs' && 'ZEEK CAPTURE LOGS'}
                  {activePage === 'telemetry' && 'SENSOR TELEMETRY'}
                </h2>
              </div>
            </div>
            <div className="text-[9px] md:text-[10px] font-mono text-slate-500 tracking-widest uppercase hidden sm:flex items-center">
              {activePage === 'stream' ? (
                <span className="flex items-center text-emerald-400 border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                  ● LIVE INGEST
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  SECURE TODAY. SAFER TOMORROW.
                </>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            <div className="flex flex-col space-y-4 md:space-y-5 h-full max-w-[1600px] mx-auto">
              {activePage === 'overview' && <ExecutiveView />}
              {activePage === 'stream' && <LiveStreamView />}
              {activePage === 'analytics' && <AnalyticsView />}
              {activePage === 'logs' && <ZeekLogsView />}
              {activePage === 'telemetry' && <TelemetryView />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// VIEWS
// ============================================================================
function LiveStreamView() {
  const [selectedEventId, setSelectedEventId] = useState('EVT-9021');
  const liveDetections = [
    { id: 'EVT-9021', severity: 'CRITICAL', title: 'DGA / DNS Anomaly', src: '10.24.18.42', dst: '10.24.1.10', engine: 'Random Forest', conf: '98.2%', time: '16:52:31' },
    { id: 'EVT-9022', severity: 'HIGH', title: 'Port Scan', src: '10.24.21.17', dst: '10.24.1.0/24', engine: 'Heuristic + RF', conf: '92.1%', time: '16:51:48' },
    { id: 'EVT-9023', severity: 'HIGH', title: 'Beaconing', src: '10.24.19.08', dst: '198.51.100.4', engine: 'XGBoost FFT', conf: '88.3%', time: '16:50:22' },
  ];
  const selectedEvent = liveDetections.find(e => e.id === selectedEventId) || liveDetections[0];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        {[
          { label: 'CRITICAL', value: '1', color: 'text-rose-500' },
          { label: 'HIGH', value: '2', color: 'text-amber-500' },
          { label: 'MEDIUM', value: '2', color: 'text-yellow-400' },
          { label: 'EVENTS / SEC', value: '18.4K', color: 'text-slate-200' },
          { label: 'CONFIDENCE', value: '91.8%', color: 'text-purple-400' },
        ].map((card, i) => (
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{card.label}</span>
            <span className={`text-lg md:text-xl font-mono font-light tracking-tight ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 shrink-0">
        <div className="flex-1 lg:flex-[0.65] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">LIVE DETECTION STREAM</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[320px]">
            {liveDetections.map((evt) => (
              <div 
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`flex items-center justify-between p-2.5 font-mono text-[11px] border cursor-pointer transition-colors ${
                  evt.id === selectedEventId ? 'bg-purple-900/20 border-purple-500/60' : 'bg-[#030712]/50 border-indigo-900/20'
                }`}
              >
                <div>
                  <div className="text-slate-200 font-bold">{evt.title}</div>
                  <div className="text-[10px] text-slate-500">{evt.src} → {evt.dst}</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold">{evt.conf}</div>
                  <span className="text-[10px] text-slate-500">{evt.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.35] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4 font-mono text-[10px]">
          <div className="text-sm font-bold text-slate-100 uppercase mb-3">{selectedEvent.title}</div>
          <div className="space-y-2 text-slate-400 mb-4 pb-3 border-b border-indigo-900/30">
            <div>SEVERITY: <span className="text-rose-400 font-bold">{selectedEvent.severity}</span></div>
            <div>SOURCE: <span className="text-slate-200">{selectedEvent.src}</span></div>
            <div>ML ENGINE: <span className="text-purple-400">{selectedEvent.engine}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveView() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <KpiCard title="TOTAL ALERTS (24H)" value="1,248" subtext="Metadata detections" icon={<Target />} trend="↑ +12%" />
        <KpiCard title="CRITICAL BREACHES" value="4" subtext="High incidents" icon={<AlertTriangle />} trend="↑ +33%" isCritical />
        <KpiCard title="AI CONFIDENCE" value="94.7%" subtext="6 Classifiers" icon={<Cpu />} trend="↑ +1.2%" isPurple />
        <KpiCard title="LATENCY" value="142 ms" subtext="Pipeline speed" icon={<Activity />} trend="↓ -18%" isPurple />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 shrink-0">
        <div className="flex-1 bg-[#0a0f1c] border border-indigo-900/30 flex flex-col h-[260px]">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">THREAT ACTIVITY — 60 MIN</h3>
          </div>
          <div className="flex-1 p-3 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatActivityData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e1b4b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #312e81', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="high" stroke="#e11d48" strokeWidth={1.5} fill="#e11d48" fillOpacity={0.1} />
                <Area type="monotone" dataKey="medium" stroke="#9333ea" strokeWidth={1.5} fill="#9333ea" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="bg-[#0a0f1c] border border-indigo-900/30 p-4 font-mono text-slate-300">
      <h3 className="text-[11px] font-bold tracking-widest text-slate-200 uppercase mb-3">MODEL PERFORMANCE METRICS</h3>
      <div className="space-y-3 text-[11px]">
        <div className="flex justify-between border-b border-indigo-900/30 pb-2"><span>Isolation Forest Accuracy</span><span className="text-purple-400">94.2%</span></div>
        <div className="flex justify-between border-b border-indigo-900/30 pb-2"><span>Random Forest Precision</span><span className="text-purple-400">95.4%</span></div>
        <div className="flex justify-between border-b border-indigo-900/30 pb-2"><span>LSTM DGA Classifier</span><span className="text-emerald-400">98.1% (Best)</span></div>
      </div>
    </div>
  );
}

function ZeekLogsView() {
  return (
    <div className="bg-[#0a0f1c] border border-indigo-900/30 p-4 font-mono text-[11px]">
      <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase mb-3">ZEEK CAPTURE LOGS</h3>
      <div className="space-y-2 bg-[#02040a] p-3 border border-indigo-900/30 rounded">
        <div className="text-indigo-300">16:54:59 [conn.log] UDP 512 bytes 10.24.18.42:53 → 10.24.0.53:53</div>
        <div className="text-amber-400">16:55:00 [notice.log] Scan::Address_Scan 65 ports scanned</div>
        <div className="text-rose-400">16:55:01 [weird.log] active_connection_reuse anomaly</div>
      </div>
    </div>
  );
}

function TelemetryView() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
      <div className="bg-[#0a0f1c] border border-indigo-900/30 p-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase mb-3">RESOURCE UTILIZATION</h3>
        <div className="space-y-3 text-[10px]">
          <div><div className="flex justify-between mb-1"><span className="text-slate-400">CPU LOAD</span><span className="text-indigo-400">42%</span></div><div className="bg-[#030712] h-1.5"><div className="bg-indigo-500 h-full w-[42%]" /></div></div>
          <div><div className="flex justify-between mb-1"><span className="text-slate-400">RAM USAGE</span><span className="text-purple-400">12.4 / 32 GB</span></div><div className="bg-[#030712] h-1.5"><div className="bg-purple-500 h-full w-[38%]" /></div></div>
        </div>
      </div>
      <div className="bg-[#0a0f1c] border border-indigo-900/30 p-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase mb-3">NODE HEALTH</h3>
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between"><span className="text-slate-400">Sensor Node 01</span><span className="text-emerald-400">● ONLINE</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Kafka Pipeline</span><span className="text-emerald-400">● CONNECTED</span></div>
        </div>
      </div>
    </div>
  );
}

// --- UTILITY COMPONENTS ---
function SidebarBtn({ icon, label, active, badge, pulse, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-2.5 font-mono text-[10px] tracking-widest transition-all ${active ? 'bg-purple-900/20 text-purple-400 border-l-2 border-purple-500' : 'text-slate-500 hover:bg-[#0a0e1c] hover:text-slate-300 border-l-2 border-transparent'}`}>
      <div className="flex items-center space-x-3"><span className="w-3.5 h-3.5 opacity-80">{icon}</span><span className="truncate">{label}</span></div>
      {badge && <span className={`px-1.5 py-0.5 rounded border ${active ? 'bg-purple-950/50 text-purple-300 border-purple-500/30' : 'bg-[#030712] text-slate-400 border-slate-800'}`}>{badge}</span>}
    </button>
  );
}

function KpiCard({ title, value, subtext, icon, trend, isCritical, isPurple }) {
  let iconColor = 'text-slate-500', valueColor = 'text-slate-200';
  let trendColor = trend.includes('↑') && !isCritical ? 'text-emerald-400' : 'text-rose-400';
  if (isCritical) { iconColor = 'text-rose-500'; valueColor = 'text-rose-400'; }
  else if (isPurple) { iconColor = 'text-purple-500'; valueColor = 'text-purple-400'; }

  return (
    <div className="bg-[#0a0f1c] border border-indigo-900/30 p-4 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{title}</span>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div>
          <div className={`text-2xl lg:text-3xl font-light font-mono tracking-tight ${valueColor}`}>{value}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{subtext}</div>
        </div>
        {trend && <div className={`text-[10px] font-mono mb-0.5 ${trendColor}`}>{trend}</div>}
      </div>
    </div>
  );
}