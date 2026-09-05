import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList
} from 'recharts';
import { 
  Shield, Activity, AlertTriangle, Crosshair, 
  Database, Layout, Terminal, Server, Cpu, 
  Target, Radio, CheckCircle2, ShieldAlert,
  Search, ArrowRight, Menu, X, Filter, Copy, ExternalLink, ActivitySquare
} from 'lucide-react';

// ============================================================================
// MOCK DATA 
// ============================================================================
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

const topSources = [
  { ip: '10.24.18.42', count: 312, width: '100%' },
  { ip: '10.24.21.17', count: 241, width: '77%' },
  { ip: '10.24.19.08', count: 198, width: '63%' },
  { ip: '10.24.14.63', count: 156, width: '50%' },
  { ip: '10.24.22.91', count: 121, width: '38%' },
];

const getSeverityColor = (severity) => {
  switch(severity) {
    case 'CRITICAL': return 'bg-rose-500';
    case 'HIGH': return 'bg-orange-500';
    case 'MEDIUM': return 'bg-yellow-500';
    case 'LOW': return 'bg-slate-500';
    default: return 'bg-slate-500';
  }
};

// ============================================================================
// MAIN APPLICATION SHELL
// ============================================================================
export default function UniShieldDashboard() {
  const [pulse, setPulse] = useState(false);
  const [activePage, setActivePage] = useState('logs'); 
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
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
          ></div>
        )}

        {/* RESPONSIVE SIDEBAR */}
        <aside className={`
          absolute md:relative z-50 top-0 bottom-0 left-0 w-[280px] bg-[#060913] border-r border-indigo-900/30 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out
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
                  <span className="text-[9px] text-slate-500 tracking-widest font-mono uppercase block mt-0.5">PASSIVE THREAT DEFENSE</span>
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

          <div className="hidden lg:flex flex-1 flex-col items-center justify-center opacity-70 pointer-events-none px-4 min-h-[160px]">
            <div className="text-center">
              <h3 className="text-[10px] font-mono font-bold text-slate-400/90 tracking-[0.15em] uppercase">National Cyber Defense</h3>
              <p className="text-[9px] font-mono text-slate-500/80 tracking-[0.25em] uppercase mt-1">Trust &bull; Monitor &bull; Protect</p>
            </div>
          </div>

          <div className="p-4 m-4 rounded border border-indigo-900/40 bg-[#0a0e1c] shrink-0 hidden md:block">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/30 pb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Passive Ingest Mode</span>
                <span className="text-[9px] font-mono text-emerald-500 border border-emerald-900/50 bg-emerald-950/20 px-1.5 py-0.5 rounded">[ RX ONLY ]</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Kafka Ingest Live
                </span>
                <span className="text-purple-400">18.4K flow/s</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#030712]">
          
          <header className="px-4 md:px-6 py-3 md:py-5 border-b border-indigo-900/30 flex items-center justify-between shrink-0 bg-[#060913]">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded border border-indigo-900/50 bg-[#0a0f1c] text-purple-400 hover:bg-indigo-900/30"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base md:text-xl font-bold tracking-widest text-slate-100 uppercase">
                  {activePage === 'overview' && 'EXECUTIVE SOC VIEW'}
                  {activePage === 'stream' && 'LIVE THREAT STREAM'}
                  {activePage === 'analytics' && 'THREAT ANALYTICS'}
                  {activePage === 'logs' && 'ZEEK CAPTURE LOGS'}
                  {activePage === 'telemetry' && 'SENSOR TELEMETRY'}
                </h2>
                <p className="hidden md:block text-[10px] font-mono text-purple-400/70 tracking-widest uppercase mt-1">
                  {activePage === 'overview' && 'REAL-TIME NETWORK THREAT SITUATION | METADATA-ONLY ANALYSIS'}
                  {activePage === 'stream' && 'CONTINUOUS METADATA-ONLY DETECTIONS | LIVE KAFKA FEED'}
                  {activePage === 'analytics' && 'DETECTION BEHAVIOR | MODEL PERFORMANCE | FEATURE CONTRIBUTION'}
                  {activePage === 'logs' && 'RAW SENSOR METADATA | LIVE EVENT STREAM'}
                  {activePage === 'telemetry' && 'HARDWARE NODE STATUS | PIPELINE HEALTH'}
                </p>
              </div>
            </div>
            <div className="text-[9px] md:text-[10px] font-mono text-slate-500 tracking-widest uppercase hidden sm:flex items-center space-x-4">
              {activePage === 'logs' ? (
                <>
                  <span>Last update: 16:55:04</span>
                  <span className="flex items-center text-emerald-400 border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    ● LIVE
                  </span>
                </>
              ) : activePage === 'stream' ? (
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

          <div className="flex-1 overflow-y-auto p-4 md:p-5">
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
// FULL VIEWS 
// ============================================================================

function ExecutiveView() {
  const pipelineStages = [
    { label: 'Zeek Sensor', status: 'ONLINE', subtext: '3/3 sensors', icon: <Terminal className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'Kafka Ingest', status: 'ACTIVE', subtext: '18.4K flows/s', icon: <Database className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'Feature Extraction', status: 'ONLINE', subtext: '< 10 ms', icon: <Cpu className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'ML Inference', status: 'ONLINE', subtext: '42 ms avg', icon: <Activity className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'Alert Engine', status: 'ONLINE', subtext: 'Emitting alerts', icon: <Radio className="w-3.5 h-3.5 text-purple-400"/> },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 shrink-0">
        <KpiCard title="TOTAL ALERTS (24H)" value="1,248" subtext="Metadata-only detections" icon={<Target />} trend="↑ +12%" />
        <KpiCard title="CRITICAL BREACHES" value="4" subtext="High severity incidents" icon={<AlertTriangle />} trend="↑ +33%" isCritical />
        <KpiCard title="AI CONFIDENCE AVG" value="94.7%" subtext="Across 6 ML classifiers" icon={<Cpu />} trend="↑ +1.2%" isPurple />
        <KpiCard title="DETECTION LATENCY" value="142 ms" subtext="End-to-end pipeline" icon={<Activity />} trend="↓ -18%" isPurple />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5 shrink-0 min-h-[300px]">
        <div className="flex-1 lg:flex-[0.65] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 flex justify-between items-center bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">THREAT ACTIVITY — LAST 60 MIN</h3>
            <span className="text-[9px] font-mono border border-emerald-900/50 text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded">[ LIVE ]</span>
          </div>
          <div className="flex-1 p-2 md:p-4 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatActivityData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/><stop offset="95%" stopColor="#e11d48" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/><stop offset="95%" stopColor="#9333ea" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e1b4b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #312e81', fontSize: '11px', fontFamily: 'monospace', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="high" stroke="#e11d48" strokeWidth={1.5} fill="url(#colorHigh)" name="High Severity" />
                <Area type="monotone" dataKey="medium" stroke="#9333ea" strokeWidth={1.5} fill="url(#colorMed)" name="Medium Severity" />
                <Area type="monotone" dataKey="low" stroke="#4f46e5" strokeWidth={1.5} fill="url(#colorLow)" name="Low Severity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.35] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">THREAT CLASSES</h3>
          </div>
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 flex items-center justify-center relative min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={threatDistribution} innerRadius="65%" outerRadius="85%" paddingAngle={2} dataKey="value" stroke="none">
                    {threatDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #312e81', fontSize: '11px', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-mono font-bold text-slate-200">27</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Active Threats</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4 pt-4 border-t border-indigo-900/30">
              {threatDistribution.slice(0, 4).map((dist, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center truncate">
                    <span className="w-1.5 h-1.5 mr-1.5 shrink-0" style={{ backgroundColor: dist.color }}></span>
                    <span className="text-slate-400 truncate w-16">{dist.name}</span>
                  </div>
                  <span className="text-slate-300">{dist.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5 flex-1 min-h-[260px]">
        <div className="flex-1 lg:flex-[0.5] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 flex justify-between items-center">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">LIVE THREAT FEED</h3>
            <button className="text-[9px] font-mono text-purple-400 hover:text-purple-300 uppercase tracking-widest">View All →</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-[9px] text-slate-500 font-mono uppercase bg-[#04060d]">
                <tr>
                  <th className="px-4 py-2.5 font-normal border-b border-indigo-900/30">SEVERITY</th>
                  <th className="px-4 py-2.5 font-normal border-b border-indigo-900/30">SOURCE IP</th>
                  <th className="px-4 py-2.5 font-normal border-b border-indigo-900/30">DETECTION</th>
                  <th className="px-4 py-2.5 font-normal border-b border-indigo-900/30 text-right">TIME</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {overviewAlerts.slice(0, 5).map((alert, i) => (
                  <tr key={i} className="border-b border-indigo-900/20 hover:bg-indigo-950/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getSeverityColor(alert.severity)}`}></span>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{alert.source}</td>
                    <td className="px-4 py-2.5 text-purple-400">{alert.detection}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-right">{alert.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.25] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">DETECTION PIPELINE</h3>
          </div>
          <div className="flex-1 flex flex-col justify-between p-5 relative font-mono">
            <div className="hidden md:block absolute left-[33px] top-8 bottom-8 w-[1px] bg-indigo-900/50"></div>
            {pipelineStages.map((stage, i) => (
              <div key={i} className="flex items-center relative z-10 mb-3 md:mb-0 last:mb-0">
                <div className="w-7 h-7 rounded border border-indigo-900/50 bg-[#060913] flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(79,70,229,0.1)] shrink-0">
                  {stage.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-300 leading-tight">{stage.label}</span>
                  <div className="flex items-center mt-0.5">
                    <span className="text-[9px] text-emerald-400 flex items-center tracking-widest">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5"></span>
                      {stage.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.25] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 flex justify-between items-center">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">TOP THREAT SOURCES</h3>
            <span className="text-[9px] font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded hidden sm:inline-block">1 Hour</span>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center space-y-3 font-mono">
            {topSources.map((source, i) => (
              <div key={i} className="flex flex-col space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300">{source.ip}</span>
                  <span className="text-purple-400 font-bold">{source.count}</span>
                </div>
                <div className="w-full bg-[#030712] border border-slate-800/60 h-1.5 rounded-sm overflow-hidden">
                  <div className="h-full bg-purple-600/80 rounded-sm" style={{ width: source.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStreamView() {
  const [selectedEventId, setSelectedEventId] = useState('EVT-9021');

  const liveDetections = [
    { id: 'EVT-9021', severity: 'CRITICAL', title: 'DGA / DNS Anomaly', src: '10.24.18.42', dst: '10.24.1.10', engine: 'Random Forest', conf: '98.2%', time: '16:52:31' },
    { id: 'EVT-9022', severity: 'HIGH', title: 'Port Scan', src: '10.24.21.17', dst: '10.24.1.0/24', engine: 'Heuristic + RF', conf: '92.1%', time: '16:51:48' },
    { id: 'EVT-9023', severity: 'HIGH', title: 'Beaconing', src: '10.24.19.08', dst: '198.51.100.4', engine: 'XGBoost FFT', conf: '88.3%', time: '16:50:22' },
    { id: 'EVT-9024', severity: 'MEDIUM', title: 'Anomalous Flow', src: '10.24.14.63', dst: '10.24.0.53', engine: 'Isolation Forest', conf: '81.4%', time: '16:49:57' },
    { id: 'EVT-9025', severity: 'MEDIUM', title: 'DNS Anomaly', src: '10.24.22.91', dst: '10.24.0.53', engine: 'CNN/LSTM', conf: '79.9%', time: '16:48:36' },
    { id: 'EVT-9026', severity: 'LOW', title: 'Encrypted Payload', src: '10.24.8.19', dst: 'External', engine: 'Autoencoder', conf: '65.2%', time: '16:45:11' },
    { id: 'EVT-9027', severity: 'LOW', title: 'Mismatched Cert', src: '10.24.5.11', dst: 'External', engine: 'JA3 Fingerprint', conf: '61.8%', time: '16:42:05' },
  ];

  const selectedEvent = liveDetections.find(e => e.id === selectedEventId) || liveDetections[0];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 shrink-0">
        {[
          { label: 'CRITICAL', value: '1', color: 'text-rose-500' },
          { label: 'HIGH', value: '2', color: 'text-amber-500' },
          { label: 'MEDIUM', value: '2', color: 'text-yellow-400' },
          { label: 'EVENTS / SEC', value: '18.4K', color: 'text-slate-200' },
          { label: 'AVG ML CONFIDENCE', value: '91.8%', color: 'text-purple-400' },
        ].map((card, i) => (
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{card.label}</span>
            <span className={`text-xl font-mono font-light tracking-tight ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5 shrink-0 min-h-[340px]">
        <div className="flex-1 lg:flex-[0.65] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">LIVE DETECTION STREAM</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 max-h-[300px] lg:max-h-full">
            {liveDetections.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              const badgeColor = evt.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                                 evt.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                 evt.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                                 'bg-slate-700/30 text-slate-400 border-slate-600/40';

              return (
                <div 
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`flex items-center justify-between p-2.5 font-mono text-[11px] border cursor-pointer transition-colors ${
                    isSelected ? 'bg-purple-900/20 border-purple-500/60 shadow-[0_0_10px_rgba(147,51,234,0.15)]' : 'bg-[#030712]/50 border-indigo-900/20 hover:border-indigo-900/50'
                  }`}
                >
                  <div className="flex items-center space-x-2 md:space-x-3 truncate pr-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${badgeColor}`}>{evt.severity}</span>
                    <div className="truncate">
                      <div className="text-slate-200 font-bold truncate">{evt.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{evt.src} → <span className="hidden sm:inline">{evt.dst}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-4 text-right shrink-0">
                    <div>
                      <div className="text-purple-400 font-bold">{evt.conf}</div>
                      <div className="text-[9px] text-slate-500 hidden sm:block">{evt.engine}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 w-12 sm:w-16">{evt.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.35] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 flex justify-between items-center">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">SELECTED EVENT</h3>
            <span className="text-[10px] font-mono text-purple-400 font-bold">{selectedEvent.id}</span>
          </div>
          
          <div className="flex-1 p-4 flex flex-col justify-between font-mono text-[10px]">
            <div>
              <div className="text-sm md:text-base font-bold text-slate-100 uppercase tracking-wide mb-3">{selectedEvent.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 text-slate-400 mb-4 pb-3 border-b border-indigo-900/30">
                <div>SEVERITY: <span className="text-rose-400 font-bold">{selectedEvent.severity}</span></div>
                <div>TIMESTAMP: <span className="text-slate-300">{selectedEvent.time}</span></div>
                <div className="sm:col-span-2 truncate">SOURCE: <span className="text-slate-200">{selectedEvent.src}</span></div>
                <div className="sm:col-span-2 truncate">TARGET: <span className="text-slate-200">{selectedEvent.dst}</span></div>
                <div>ENGINE: <span className="text-purple-400">{selectedEvent.engine}</span></div>
                <div>CONFIDENCE: <span className="text-emerald-400">{selectedEvent.conf}</span></div>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase tracking-widest mb-2">DETECTION FEATURES</span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  <div className="bg-[#030712] p-1.5 rounded border border-slate-800 flex justify-between"><span className="text-slate-500">ENTROPY</span><span className="text-rose-400 font-bold">HIGH</span></div>
                  <div className="bg-[#030712] p-1.5 rounded border border-slate-800 flex justify-between"><span className="text-slate-500">ARRIVAL</span><span className="text-rose-400 font-bold">HIGH</span></div>
                  <div className="bg-[#030712] p-1.5 rounded border border-slate-800 flex justify-between"><span className="text-slate-500">FAN-OUT</span><span className="text-amber-400 font-bold">MED</span></div>
                  <div className="bg-[#030712] p-1.5 rounded border border-slate-800 flex justify-between"><span className="text-slate-500">DNS ANO</span><span className="text-rose-400 font-bold">HIGH</span></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 text-purple-300 text-[10px] font-mono tracking-widest uppercase py-2 rounded transition-colors text-center">
              [ VIEW IN THREAT ANALYTICS ]
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-indigo-900/30 shrink-0">
        <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 flex items-center justify-between">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">FULL EVENT LOG</h3>
        </div>
        <div className="overflow-x-auto max-h-[300px] md:max-h-[220px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-[9px] text-slate-500 font-mono uppercase bg-[#04060d] sticky top-0 z-10 border-b border-indigo-900/30">
              <tr>
                <th className="px-4 py-2.5 font-normal">TIMESTAMP</th>
                <th className="px-4 py-2.5 font-normal hidden sm:table-cell">INCIDENT ID</th>
                <th className="px-4 py-2.5 font-normal">SEVERITY</th>
                <th className="px-4 py-2.5 font-normal">THREAT CLASS</th>
                <th className="px-4 py-2.5 font-normal hidden md:table-cell">SOURCE IP</th>
                <th className="px-4 py-2.5 font-normal text-right">CONFIDENCE</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[10px] md:text-[11px]">
              {overviewAlerts.map((alert, i) => (
                <tr key={i} className="border-b border-indigo-900/20 hover:bg-indigo-950/20 transition-colors">
                  <td className="px-4 py-2 text-slate-500">{alert.time}</td>
                  <td className="px-4 py-2 text-slate-600 hidden sm:table-cell">{alert.id}</td>
                  <td className="px-4 py-2">
                    <span className="flex items-center text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getSeverityColor(alert.severity)}`}></span>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-300">{alert.detection}</td>
                  <td className="px-4 py-2 text-rose-400 hidden md:table-cell">{alert.source}</td>
                  <td className="px-4 py-2 text-right text-purple-400 font-bold">{alert.conf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView() {
  const featureContribution = [
    { name: 'Source Entropy', value: 31 },
    { name: 'Inter-Arrival Variance', value: 24 },
    { name: 'Port Fan-out Ratio', value: 19 },
    { name: 'Payload Size Variance', value: 14 },
    { name: 'DNS Bigram Anomaly', value: 12 },
  ];

  const inferenceLatency = [
    { name: 'IsoForest', ms: 18 },
    { name: 'RandForest', ms: 24 },
    { name: 'XGBoost', ms: 31 },
    { name: 'Autoenc', ms: 52 },
    { name: 'LSTM', ms: 87 },
  ];

  const modelPerformance = [
    { name: 'Isolation Forest', acc: '94.2%', prec: '92.8%', rec: '91.6%', lat: '18 ms', best: false },
    { name: 'Random Forest', acc: '96.1%', prec: '95.4%', rec: '94.8%', lat: '24 ms', best: false },
    { name: 'XGBoost', acc: '97.3%', prec: '96.8%', rec: '95.9%', lat: '31 ms', best: false },
    { name: 'Autoencoder', acc: '95.8%', prec: '94.1%', rec: '93.5%', lat: '52 ms', best: false },
    { name: 'LSTM (DGA)', acc: '98.1%', prec: '97.5%', rec: '96.9%', lat: '87 ms', best: true },
  ];

  const detectionImpact = [
    { name: 'DGA / DNS', events: 312, conf: '96.4%' },
    { name: 'Port Scanning', events: 241, conf: '94.8%' },
    { name: 'Beaconing', events: 198, conf: '93.1%' },
    { name: 'Anomalous Flow', events: 156, conf: '91.7%' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 shrink-0">
        {[
          { label: 'ACTIVE ML MODELS', value: '6' },
          { label: 'AVG ACCURACY', value: '96.8%' },
          { label: 'AVG INFERENCE', value: '42 ms' },
          { label: 'FLOWS ANALYZED', value: '1.8M' },
          { label: 'MODEL DRIFT', value: 'NORMAL', isGreen: true }
        ].map((metric, i) => (
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-light tracking-tight ${metric.isGreen ? 'text-emerald-400' : 'text-slate-200'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[260px]">
        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4">
          <div className="flex flex-col border-b border-indigo-900/30 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">RELATIVE FEATURE IMPORTANCE</h3>
            <span className="text-[9px] font-mono text-purple-400/80 tracking-widest uppercase mt-0.5">NORMALIZED CONTRIBUTION</span>
          </div>
          <div className="flex-1 flex flex-col justify-between space-y-2 lg:space-y-0">
            {featureContribution.map((feat) => (
              <div key={feat.name} className="flex items-center">
                <span className="w-32 md:w-36 text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate">{feat.name}</span>
                <div className="flex-1 mx-3 bg-[#030712] h-1.5 border border-slate-800/80">
                  <div className="bg-purple-600/80 h-full" style={{ width: `${feat.value}%` }}></div>
                </div>
                <span className="w-8 text-right text-[10px] font-mono text-slate-300 font-bold">{feat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4">
          <div className="flex flex-col border-b border-indigo-900/30 pb-3 mb-2">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">MODEL INFERENCE LATENCY</h3>
            <span className="text-[9px] font-mono text-purple-400/80 tracking-widest uppercase mt-0.5">LOWER IS BETTER</span>
          </div>
          <div className="flex-1 min-h-[150px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inferenceLatency} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e1b4b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval={0} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={() => ``} fontFamily="monospace" />
                <RechartsTooltip cursor={{fill: '#060913'}} contentStyle={{ backgroundColor: '#030712', border: '1px solid #312e81', fontSize: '11px', fontFamily: 'monospace', color: '#f8fafc' }} formatter={(value) => [`${value} ms`, 'Latency']} />
                <Bar dataKey="ms" fill="#9333ea" radius={[0, 0, 0, 0]} maxBarSize={45}>
                  <LabelList dataKey="ms" position="top" fill="#e2e8f0" fontSize={9} fontFamily="monospace" formatter={(val) => `${val} ms`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-indigo-900/30 shrink-0">
        <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">MODEL PERFORMANCE COMPARISON</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-[9px] text-slate-500 font-mono uppercase bg-[#04060d]">
              <tr>
                <th className="px-5 py-2.5 font-normal border-b border-indigo-900/30">MODEL</th>
                <th className="px-5 py-2.5 font-normal border-b border-indigo-900/30 text-right">ACCURACY</th>
                <th className="px-5 py-2.5 font-normal border-b border-indigo-900/30 text-right">PRECISION</th>
                <th className="px-5 py-2.5 font-normal border-b border-indigo-900/30 text-right hidden sm:table-cell">RECALL</th>
                <th className="px-5 py-2.5 font-normal border-b border-indigo-900/30 text-right">LATENCY</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[10px] md:text-[11px]">
              {modelPerformance.map((mod, i) => (
                <tr key={i} className="border-b border-indigo-900/20 hover:bg-indigo-950/20 transition-colors">
                  <td className={`px-5 py-2.5 ${mod.best ? 'text-purple-400 font-bold' : 'text-slate-300'}`}>{mod.name}</td>
                  <td className={`px-5 py-2.5 text-right ${mod.best ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{mod.acc}</td>
                  <td className={`px-5 py-2.5 text-right ${mod.best ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{mod.prec}</td>
                  <td className={`px-5 py-2.5 text-right hidden sm:table-cell ${mod.best ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{mod.rec}</td>
                  <td className="px-5 py-2.5 text-right text-slate-500">{mod.lat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZEEK LOGS VIEW (COMPLETELY REDESIGNED)
// ============================================================================
function ZeekLogsView() {
  const [selectedEventId, setSelectedEventId] = useState('Cn2b211');

  // Realistic Zeek Event Mock Data (Section 3 format)
  const zeekEvents = [
    {
      id: 'CjH2u123', ts: '16:55:04.12', log: 'conn.log', uid: 'CjH2u123', 
      src: '10.24.5.18:54210', dst: '10.24.1.10:80', 
      summary: 'TCP   14280 bytes   duration 0.82s', 
      color: 'text-slate-300', severity: 'INFO',
      type: 'CONNECTION', ports: '80',
      raw: { "ts": 165504.12, "uid": "CjH2u123", "id.orig_h": "10.24.5.18", "id.orig_p": 54210, "id.resp_h": "10.24.1.10", "id.resp_p": 80, "proto": "tcp", "duration": 0.82, "orig_bytes": 1024, "resp_bytes": 14280 }
    },
    {
      id: 'Cd87a32', ts: '16:55:03.87', log: 'dns.log', uid: 'Cd87a32', 
      src: '10.24.7.41', dst: '10.24.0.53', 
      summary: 'query: 3fa7b12.tunnel.c2node.io\ntype: TXT   status: NOERROR', 
      color: 'text-slate-300', severity: 'INFO',
      type: 'DNS QUERY', ports: '53',
      raw: { "ts": 165503.87, "uid": "Cd87a32", "id.orig_h": "10.24.7.41", "id.resp_h": "10.24.0.53", "query": "3fa7b12.tunnel.c2node.io", "qtype_name": "TXT", "rcode_name": "NOERROR" }
    },
    {
      id: 'Cs34f99', ts: '16:55:02.41', log: 'ssl.log', uid: 'Cs34f99', 
      src: '10.24.8.19:443', dst: '—', 
      summary: 'TLSv1.2   TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', 
      color: 'text-slate-300', severity: 'INFO',
      type: 'SSL HANDSHAKE', ports: '443',
      raw: { "ts": 165502.41, "uid": "Cs34f99", "id.orig_h": "10.24.8.19", "id.resp_p": 443, "version": "TLSv1.2", "cipher": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256" }
    },
    {
      id: 'Cw91x00', ts: '16:55:01.22', log: 'weird.log', uid: 'Cw91x00', 
      src: '10.24.3.22', dst: '—', 
      summary: 'active_connection_reuse', 
      color: 'text-rose-500', severity: 'SUSPICIOUS',
      type: 'WEIRD ACTIVITY', ports: '—',
      raw: { "ts": 165501.22, "uid": "Cw91x00", "id.orig_h": "10.24.3.22", "name": "active_connection_reuse", "notice": false, "peer": "zeek-sensor-02" }
    },
    {
      id: 'Cn2b211', ts: '16:55:00.94', log: 'notice.log', uid: 'Cn2b211', 
      src: '10.24.3.22', dst: '—', 
      summary: 'Scan::Address_Scan\n65 ports scanned', 
      color: 'text-amber-500', severity: 'HIGH',
      type: 'NOTICE', ports: '65',
      raw: { "ts": 165500.94, "uid": "Cn2b211", "src": "10.24.3.22", "notice": "Scan::Address_Scan", "msg": "65 ports scanned", "sub": "remote", "actions": ["Notice::ACTION_LOG"] }
    },
    {
      id: 'Ch9k312', ts: '16:54:59.72', log: 'conn.log', uid: 'Ch9k312', 
      src: '10.24.18.42:53', dst: '10.24.0.53:53', 
      summary: 'UDP   512 bytes', 
      color: 'text-slate-300', severity: 'INFO',
      type: 'CONNECTION', ports: '53',
      raw: { "ts": 165459.72, "uid": "Ch9k312", "id.orig_h": "10.24.18.42", "id.orig_p": 53, "id.resp_h": "10.24.0.53", "id.resp_p": 53, "proto": "udp", "orig_bytes": 256, "resp_bytes": 256 }
    },
  ];

  const selectedEvent = zeekEvents.find(e => e.id === selectedEventId) || zeekEvents[4];

  return (
    <div className="flex flex-col h-full space-y-4 font-mono">
      
      {/* SECTION 1 - SENSOR SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'EVENTS / SEC', value: '18.4K' },
          { label: 'CONNECTIONS', value: '12,804' },
          { label: 'DNS EVENTS', value: '4,921' },
          { label: 'SECURITY NOTICES', value: '6', color: 'text-emerald-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
            <span className={`text-xl font-light tracking-tight ${stat.color || 'text-slate-200'}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* SECTION 2 - LOG FILTER BAR */}
      <div className="bg-[#0a0f1c] border border-indigo-900/30 p-2 md:p-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between text-[10px] uppercase tracking-widest text-slate-400 gap-3 md:gap-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-300 bg-[#030712] border border-slate-800 px-2 py-1 rounded cursor-pointer hover:border-slate-600">LOG SOURCE: ALL ▼</span>
          </div>
          <span className="text-slate-300 bg-[#030712] border border-slate-800 px-2 py-1 rounded cursor-pointer hover:border-slate-600">SEVERITY: ALL ▼</span>
          <span className="text-slate-300 bg-[#030712] border border-slate-800 px-2 py-1 rounded cursor-pointer hover:border-slate-600">PROTOCOL: ALL ▼</span>
          
          <div className="flex items-center bg-[#030712] border border-slate-800 rounded px-2 py-1 min-w-[200px]">
            <Search className="w-3 h-3 mr-2 text-slate-500" />
            <input type="text" placeholder="Search IP, domain, UID..." className="bg-transparent border-none outline-none text-slate-300 placeholder-slate-600 w-full" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-slate-300 bg-[#030712] border border-slate-800 px-2 py-1 rounded cursor-pointer hover:border-slate-600">Last 15 min ▼</span>
          <div className="flex items-center text-emerald-400 border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
            LIVE
          </div>
        </div>
      </div>

      {/* SECTION 3 & 4 - MAIN LOG EXPLORER & EVENT INSPECTOR */}
      <div className="flex flex-col lg:flex-row gap-4 shrink-0 min-h-[450px]">
        
        {/* SECTION 3 - LIVE ZEEK EVENT STREAM */}
        <div className="flex-1 lg:flex-[0.65] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">LIVE ZEEK EVENT STREAM</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#02040a] p-3 space-y-2.5 text-[11px] leading-relaxed">
            {zeekEvents.map((evt) => (
              <div 
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`p-2.5 border-l-2 cursor-pointer transition-colors ${
                  selectedEventId === evt.id ? 'bg-purple-900/10 border-purple-500' : 'border-transparent hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-slate-500">{evt.ts}</span>
                  <span className={`font-bold ${evt.color}`}>[{evt.log}]</span>
                </div>
                <div className="text-slate-300 mb-1">
                  <span className="text-purple-400/80 mr-3">{evt.uid}</span>
                  {evt.src} {evt.dst !== '—' && <span className="text-slate-500">→ {evt.dst}</span>}
                </div>
                <div className="text-slate-400 whitespace-pre-wrap">
                  {evt.summary}
                </div>
              </div>
            ))}
            
            <div className="p-2.5 flex items-center text-slate-500 text-[10px] mt-4 opacity-70">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Waiting for next event...
            </div>
          </div>
        </div>

        {/* SECTION 4 - EVENT INSPECTOR */}
        <div className="flex-1 lg:flex-[0.35] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">EVENT INSPECTOR</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col text-[10px]">
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6">
              <div><span className="text-slate-500 block mb-0.5">EVENT TYPE</span> <span className={selectedEvent.color}>{selectedEvent.type}</span></div>
              <div><span className="text-slate-500 block mb-0.5">LOG SOURCE</span> <span className="text-slate-300">{selectedEvent.log}</span></div>
              <div><span className="text-slate-500 block mb-0.5">TIMESTAMP</span> <span className="text-slate-300">{selectedEvent.ts}</span></div>
              <div><span className="text-slate-500 block mb-0.5">CONNECTION UID</span> <span className="text-purple-400">{selectedEvent.uid}</span></div>
              <div><span className="text-slate-500 block mb-0.5">SOURCE IP</span> <span className="text-slate-300">{selectedEvent.raw['id.orig_h'] || selectedEvent.raw['src'] || '—'}</span></div>
              <div><span className="text-slate-500 block mb-0.5">DESTINATION</span> <span className="text-slate-300">{selectedEvent.raw['id.resp_h'] || '—'}</span></div>
              <div className="col-span-2"><span className="text-slate-500 block mb-0.5">DETECTION / MSG</span> <span className="text-slate-300">{selectedEvent.raw['notice'] || selectedEvent.raw['name'] || selectedEvent.raw['query'] || '—'}</span></div>
              <div><span className="text-slate-500 block mb-0.5">PORTS</span> <span className="text-slate-300">{selectedEvent.ports}</span></div>
              <div><span className="text-slate-500 block mb-0.5">SEVERITY</span> <span className={`font-bold ${selectedEvent.severity === 'HIGH' ? 'text-amber-500' : selectedEvent.severity === 'SUSPICIOUS' ? 'text-rose-500' : 'text-slate-400'}`}>{selectedEvent.severity}</span></div>
            </div>

            <div className="mt-auto">
              <span className="text-slate-500 block mb-2 uppercase tracking-widest">RAW EVENT</span>
              <pre className="bg-[#02040a] border border-slate-800 p-3 rounded text-[10px] text-indigo-300/80 overflow-x-auto whitespace-pre-wrap word-break-all mb-4">
                {JSON.stringify(selectedEvent.raw, null, 2)}
              </pre>

              <div className="flex space-x-3">
                <button className="flex-1 flex items-center justify-center bg-[#060913] border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 py-2 rounded transition-colors uppercase tracking-widest">
                  <Copy className="w-3 h-3 mr-2" /> COPY EVENT
                </button>
                <button className="flex-1 flex items-center justify-center bg-purple-900/30 border border-purple-500/50 hover:bg-purple-900/50 text-purple-300 py-2 rounded transition-colors uppercase tracking-widest">
                  <ActivitySquare className="w-3 h-3 mr-2" /> THREAT STREAM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 - LOG SOURCE SUMMARY */}
      <div className="bg-[#0a0f1c] border border-indigo-900/30 p-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between text-[10px] uppercase tracking-widest gap-3 md:gap-0">
        <span className="text-slate-500 font-bold hidden lg:block">LOG SOURCES</span>
        <div className="flex flex-wrap items-center gap-4 lg:gap-8 flex-1 lg:justify-center">
          <div className="flex items-center"><span className="text-slate-400 w-20">conn.log</span> <span className="text-slate-200 font-bold">12.8K</span></div>
          <div className="flex items-center"><span className="text-slate-400 w-20">dns.log</span> <span className="text-slate-200 font-bold">4.9K</span></div>
          <div className="flex items-center"><span className="text-slate-400 w-20">ssl.log</span> <span className="text-slate-200 font-bold">1.8K</span></div>
          <div className="flex items-center"><span className="text-slate-400 w-20">http.log</span> <span className="text-slate-200 font-bold">0.9K</span></div>
          <div className="flex items-center"><span className="text-amber-500 w-20">notice.log</span> <span className="text-amber-400 font-bold">6</span></div>
          <div className="flex items-center"><span className="text-rose-500 w-20">weird.log</span> <span className="text-rose-400 font-bold">4</span></div>
        </div>
      </div>

      {/* SECTION 6 - SECURITY CORRELATION */}
      <div className="shrink-0 flex flex-col">
        <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">RECENT SECURITY CORRELATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col text-[10px]">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">HIGH</span>
              <span className="text-slate-300">10.24.3.22</span>
            </div>
            <span className="text-slate-200 mb-0.5">Address Scan (65 ports)</span>
            <span className="text-slate-500 flex items-center mt-2"><ArrowRight className="w-3 h-3 mr-1" /> Detected by Zeek</span>
          </div>

          <div className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col text-[10px]">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-bold">MEDIUM</span>
              <span className="text-slate-300">10.24.7.41</span>
            </div>
            <span className="text-slate-200 mb-0.5">Suspicious DNS TXT query</span>
            <span className="text-purple-400/80 flex items-center mt-2"><ArrowRight className="w-3 h-3 mr-1" /> Forwarded to ML pipeline</span>
          </div>

          <div className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col text-[10px]">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">HIGH</span>
              <span className="text-slate-300">10.24.18.42</span>
            </div>
            <span className="text-slate-200 mb-0.5">Abnormal beaconing pattern</span>
            <span className="text-purple-400 font-bold flex items-center mt-2"><ArrowRight className="w-3 h-3 mr-1" /> Correlated with threat analytics</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function TelemetryView() {
  const computeStats = [
    { label: 'CPU', value: '42%', percentage: 42, color: 'bg-indigo-500' },
    { label: 'RAM', value: '12.4/32 GB', percentage: 38, color: 'bg-purple-500' },
    { label: 'Kafka Buffer', value: '8.2%', percentage: 8.2, color: 'bg-rose-500' },
    { label: 'Disk', value: '37%', percentage: 37, color: 'bg-slate-400' },
    { label: 'Network', value: '64%', percentage: 64, color: 'bg-cyan-500' },
  ];

  const nodeStatus = [
    { name: 'Sensor-01', status: 'ONLINE', icon: 'bg-emerald-500' },
    { name: 'Zeek', status: 'RUNNING', icon: 'bg-emerald-500' },
    { name: 'Kafka', status: 'CONNECTED', icon: 'bg-emerald-500' },
    { name: 'ML', status: 'READY', icon: 'bg-emerald-500' },
  ];

  const pipelineFlow = [
    { name: 'SENSOR', rate: '18.4K/s', active: true },
    { name: 'ZEEK', rate: '18.4K/s', active: true },
    { name: 'KAFKA', rate: '18.3K/s', active: true },
    { name: 'ENGINE', rate: '18.3K/s', active: true },
    { name: 'ML', rate: '18.2K/s', active: true },
    { name: 'ALERTS', rate: '6', active: true, isEnd: true },
  ];

  const throughputData = [
    { time: '16:50', rate: 17.8 }, { time: '16:51', rate: 18.2 },
    { time: '16:52', rate: 18.4 }, { time: '16:53', rate: 18.1 },
    { time: '16:54', rate: 18.5 }, { time: '16:55', rate: 18.4 },
  ];

  const systemEvents = [
    { time: '16:55', event: 'Kafka healthy' },
    { time: '16:54', event: 'Zeek event buffer flush' },
    { time: '16:53', event: 'ML pipeline ready' },
    { time: '16:51', event: 'New sensor node connected' },
    { time: '16:48', event: 'Kafka rebalancing complete' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 shrink-0">
        {[
          { label: 'CPU', value: '42%' },
          { label: 'RAM', value: '12.4/32GB' },
          { label: 'FLOW RATE', value: '18.4K/s' },
          { label: 'PACKET DROP', value: '0.02%' },
          { label: 'PIPELINE', value: 'HEALTHY', isGreen: true }
        ].map((metric, i) => (
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-light tracking-tight ${metric.isGreen ? 'text-emerald-400' : 'text-slate-200'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[220px]">
        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">COMPUTE UTILIZATION</h3>
          <div className="flex-1 flex flex-col justify-between space-y-2 lg:space-y-0">
            {computeStats.map((stat, i) => (
              <div key={i} className="flex items-center">
                <span className="w-20 md:w-28 text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <div className="flex-1 mx-2 md:mx-3 bg-[#030712] h-1.5 border border-slate-800/80">
                  <div className={`${stat.color} h-full`} style={{ width: `${stat.percentage}%` }}></div>
                </div>
                <span className="w-16 md:w-20 text-right text-[9px] md:text-[10px] font-mono text-slate-300 font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">SENSOR NODE STATUS</h3>
          <div className="flex-1 flex flex-col justify-center space-y-3 md:space-y-4">
            {nodeStatus.map((node, i) => (
              <div key={i} className="flex items-center justify-between font-mono text-[10px] md:text-[11px]">
                <div className="flex items-center text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full mr-3 ${node.icon} animate-pulse`}></span>
                  {node.name}
                </div>
                <span className="text-emerald-400 font-bold tracking-widest">{node.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-indigo-900/30 p-4 shrink-0 flex flex-col relative overflow-hidden hidden sm:flex">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
        <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-6">DATA PIPELINE</h3>
        <div className="grid grid-cols-3 lg:flex lg:items-center lg:justify-between gap-y-6 px-2 lg:px-8 pb-4">
          {pipelineFlow.map((stage, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center space-y-2 md:space-y-3">
                <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest">{stage.name}</span>
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                <span className={`text-[9px] md:text-[10px] font-mono font-bold ${stage.isEnd ? 'text-rose-400' : 'text-slate-300'}`}>{stage.rate}</span>
              </div>
              {i < pipelineFlow.length - 1 && (
                <div className="hidden lg:flex flex-1 items-center justify-center -mt-6 opacity-50">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 flex-1 min-h-[200px]">
        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-2">TELEMETRY THROUGHPUT</h3>
          <div className="flex-1 min-h-[120px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e1b4b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <YAxis domain={[17, 19]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}K`} fontFamily="monospace" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #312e81', fontSize: '11px', fontFamily: 'monospace', color: '#f8fafc' }} formatter={(value) => [`${value}K/s`, 'Rate']} />
                <Area type="monotone" dataKey="rate" stroke="#9333ea" strokeWidth={1.5} fill="url(#colorRate)" activeDot={{ r: 4, fill: '#9333ea', stroke: '#0f172a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-3">SYSTEM EVENTS</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-1 max-h-[150px] lg:max-h-full">
            {systemEvents.map((evt, i) => (
              <div key={i} className="flex font-mono text-[10px] md:text-[11px] py-1.5 border-b border-indigo-900/20 last:border-0">
                <span className="text-slate-500 w-14 md:w-16 shrink-0">{evt.time}</span>
                <span className="text-slate-300">{evt.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED UTILITY COMPONENTS
// ============================================================================
function SidebarBtn({ icon, label, active, badge, pulse, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 font-mono text-[10px] tracking-widest transition-all ${
      active 
        ? 'bg-purple-900/20 text-purple-400 border-l-2 border-purple-500' 
        : 'text-slate-500 hover:bg-[#0a0e1c] hover:text-slate-300 border-l-2 border-transparent'
    }`}>
      <div className="flex items-center space-x-3">
        <span className="w-3.5 h-3.5 opacity-80 shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className={`px-1.5 py-0.5 rounded border shrink-0 ${
          active ? 'bg-purple-950/50 text-purple-300 border-purple-500/30' : 'bg-[#030712] text-slate-400 border-slate-800'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function KpiCard({ title, value, subtext, icon, trend, isCritical, isPurple }) {
  let iconColor = 'text-slate-500';
  let valueColor = 'text-slate-200';
  let trendColor = trend.includes('↑') && !isCritical ? 'text-emerald-400' : 
                   trend.includes('↓') ? 'text-emerald-400' : 'text-rose-400';

  if (isCritical) {
    iconColor = 'text-rose-500';
    valueColor = 'text-rose-400';
  } else if (isPurple) {
    iconColor = 'text-purple-500';
    valueColor = 'text-purple-400';
  }

  return (
    <div className="bg-[#0a0f1c] border border-indigo-900/30 p-3 md:p-4 flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-2 md:mb-3">
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono truncate mr-2">{title}</span>
        <div className={`${iconColor} shrink-0`}>{icon}</div>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
        <div>
          <div className={`text-2xl lg:text-3xl font-light font-mono tracking-tight ${valueColor}`}>{value}</div>
          <div className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 md:mt-1 font-mono truncate max-w-[120px] sm:max-w-full">{subtext}</div>
        </div>
        {trend && (
          <div className={`text-[9px] md:text-[10px] font-mono mb-0.5 md:mb-1 shrink-0 ${trendColor}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}