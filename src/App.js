import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList, ReferenceLine, Label
} from 'recharts';
import { 
  Shield, Activity, AlertTriangle, Crosshair, 
  Layout, Terminal, Server, Cpu, 
  Target, ShieldAlert,
  Search, ArrowRight, Menu, X, Filter, Copy, ActivitySquare, CheckCircle, Clock, XCircle, Play, Link, Zap
} from 'lucide-react';

// ============================================================================
// ENVIRONMENT & API CONFIGURATION
// ============================================================================
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env?.VITE_WS_URL || 'ws://localhost:8000/ws';

// ============================================================================
// GLOBAL SCROLLBAR STYLES
// ============================================================================
const ScrollbarStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(79, 70, 229, 0.4);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(99, 102, 241, 0.8);
    }
  `}</style>
);

// ============================================================================
// UTILITIES & FORMATTING
// ============================================================================
const pad = (num) => num.toString().padStart(2, '0');

const formatDateTime = (dateObj) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = pad(dateObj.getDate());
  const m = months[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  const hh = pad(dateObj.getHours());
  const mm = pad(dateObj.getMinutes());
  const ss = pad(dateObj.getSeconds());
  return `${d} ${m} ${y}    ${hh}:${mm}:${ss}`;
};

const getSeverityColor = (severity) => {
  switch(severity) {
    case 'CRITICAL': return 'text-rose-500';
    case 'HIGH': return 'text-orange-500';
    case 'MEDIUM': return 'text-yellow-500';
    case 'LOW': return 'text-purple-400';
    default: return 'text-slate-500';
  }
};

const getSeverityBg = (severity) => {
  switch(severity) {
    case 'CRITICAL': return 'bg-rose-500 text-white border-rose-500';
    case 'HIGH': return 'bg-orange-500 text-white border-orange-400';
    case 'MEDIUM': return 'bg-yellow-500 text-slate-900 border-yellow-400';
    case 'LOW': return 'bg-purple-900/60 text-purple-300 border-purple-500/50';
    case 'INFO': return 'bg-slate-700 text-slate-200 border-slate-500';
    default: return 'bg-[#060913] text-slate-500 border-slate-800/60';
  }
};

// ============================================================================
// LIVE BACKEND ADAPTER & CAPABILITY DISCOVERY
// ============================================================================
function useLiveBackend() {
  const [events, setEvents] = useState([]);
  const [connectionState, setConnectionState] = useState('CONNECTING');
  
  // Backend Capability Flags (Set to false until FastAPI provides them)
  const [capabilities, setCapabilities] = useState({
    explainability: false,
    correlation: false,
    replay: false,
    simulation: false,
    mitigation: false
  });

  useEffect(() => {
    let isMounted = true;
    
    // Simulate initial capability fetch from FastAPI
    // fetch(`${API_BASE_URL}/api/v1/capabilities`) ...
    
    setTimeout(() => {
      if (!isMounted) return;
      const initialEvents = generateHistoricalBackendEvents();
      setEvents(initialEvents);
      setConnectionState('LIVE');
    }, 1000);

    const streamInterval = setInterval(() => {
      if (!isMounted) return;
      const newEvent = createBackendEventContract(new Date());
      setEvents(prev => [newEvent, ...prev].slice(0, 2000));
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(streamInterval);
    };
  }, []);

  return { events, connectionState, capabilities };
}

function createBackendEventContract(dateObj) {
  const isThreat = Math.random() > 0.35;
  const isCritical = isThreat && Math.random() > 0.85;
  const severity = isCritical ? 'CRITICAL' : isThreat ? (Math.random() > 0.6 ? 'HIGH' : 'MEDIUM') : 'LOW';
  
  const threatTypes = ['Port Scan', 'DGA / DNS Anomaly', 'Beaconing', 'HTTP Flood', 'SYN Flood'];
  const type = isThreat ? threatTypes[Math.floor(Math.random() * threatTypes.length)] : 'Normal Traffic';
  const srcIp = `10.24.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 255)}`;
  const eventId = `EVT-${Math.floor(Math.random() * 90000) + 10000}`;
  
  return {
    id: eventId,
    timestamp: dateObj.getTime(),
    timeLabel: `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`,
    log_source: 'conn.log',
    src_ip: srcIp,
    dst_ip: `198.51.100.${Math.floor(Math.random() * 255)}`,
    ports: [53, 80, 443, 8080, 22][Math.floor(Math.random() * 5)],
    
    ai_assessment: {
      threat_type: type,
      severity: severity,
      verdict: isThreat ? 'THREAT' : 'FALSE POSITIVE',
      confidence: isThreat ? (0.88 + Math.random() * 0.11) : (0.75 + Math.random() * 0.20),
      // Explanations/Features remain here but will only render if capability == true
      explanation: `AI detected abnormal behavior matching known ${type} signatures.`,
      evidence: ["Connection frequency exceeds baseline by 400%"],
      model_consensus: {
        isolation_forest: { verdict: isThreat ? 'THREAT' : 'FALSE POSITIVE', confidence: 0.92 },
      }
    },
    raw_event: {
      "ts": dateObj.getTime() / 1000,
      "uid": eventId,
      "id.orig_h": srcIp,
      "proto": "TCP"
    }
  };
}

function generateHistoricalBackendEvents() {
  const events = [];
  const now = new Date();
  for (let i = 0; i < 300; i++) {
    const pastDate = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    events.push(createBackendEventContract(pastDate));
  }
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// ============================================================================
// HIGH-VISIBILITY LAYERED SOC BACKGROUND
// ============================================================================
const BackgroundEffects = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#020713]">
    <div className="absolute inset-0 opacity-[0.85]" style={{
      background: `
        radial-gradient(circle at 80% 20%, rgba(67, 56, 202, 0.45) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.25) 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 45%)
      `
    }} />
    <div className="absolute inset-0 opacity-[0.08]" style={{
      backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.8) 1px, transparent 1px)`,
      backgroundSize: '40px 40px'
    }} />
    <svg className="absolute inset-0 w-full h-full opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="soc-cyber-pattern" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          <path d="M 0 40 L 40 40 L 60 60 L 120 60 L 140 80 L 180 80" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.8" />
          <circle cx="180" cy="80" r="3.5" fill="#818cf8" opacity="1" />
          <path d="M 400 280 L 360 280 L 320 240 L 260 240 L 240 220 L 200 220" fill="none" stroke="#a78bfa" strokeWidth="2" opacity="0.8" />
          <circle cx="200" cy="220" r="3" fill="#a78bfa" opacity="1" />
          <path d="M 80 400 L 80 360 L 120 320 L 120 280 L 140 260 L 180 260" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.7" />
          <circle cx="180" cy="260" r="2.5" fill="#60a5fa" opacity="1" />
          <path d="M 280 120 L 320 100 L 340 140 L 300 160 Z" fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.7" />
          <circle cx="280" cy="120" r="4.5" fill="#c084fc" />
          <circle cx="320" cy="100" r="2.5" fill="#c084fc" />
          <circle cx="340" cy="140" r="5" fill="#c084fc" />
          <circle cx="300" cy="160" r="3.5" fill="#c084fc" />
          <path d="M 0 320 C 100 320, 150 360, 200 360 S 300 320, 400 320" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 12" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#soc-cyber-pattern)" />
    </svg>
    <div className="absolute top-[45%] right-[8%] transform -translate-y-1/2 flex flex-col items-center justify-center opacity-[0.14] pointer-events-none">
      <Shield className="w-[60vh] h-[60vh] text-indigo-400" strokeWidth={0.5} />
      <div className="font-mono text-[3.5vh] tracking-[0.6em] text-indigo-400 mt-6 font-bold uppercase drop-shadow-[0_0_15px_rgba(129,140,248,0.6)]">UNISHIELD AI</div>
      <div className="font-mono text-[1.5vh] tracking-[0.4em] text-indigo-300 mt-2 font-light uppercase opacity-90">TRUST • MONITOR • PROTECT</div>
    </div>
  </div>
);

const SidebarBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.25]">
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sidebar-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 0 20 L 20 20 L 40 40 L 60 40" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.9" />
          <circle cx="60" cy="40" r="2.5" fill="#818cf8" />
          <path d="M 100 80 L 80 80 L 60 60 L 40 60" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8" />
          <circle cx="40" cy="60" r="2.5" fill="#a78bfa" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sidebar-pattern)" />
    </svg>
    <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 opacity-35">
      <Shield className="w-56 h-56 text-indigo-500" strokeWidth={0.5} />
    </div>
  </div>
);

// ============================================================================
// MAIN APPLICATION SHELL
// ============================================================================
export default function UniShieldDashboard() {
  const [pulse, setPulse] = useState(false);
  const [activePage, setActivePage] = useState('overview'); 
  const [globalSelectedEventId, setGlobalSelectedEventId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { events, connectionState, capabilities } = useLiveBackend();
  
  useEffect(() => {
    const interval = setInterval(() => setPulse(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigateTo = (page, eventId = null) => {
    setActivePage(page);
    if (eventId) setGlobalSelectedEventId(eventId);
    setMobileMenuOpen(false);
  };

  const getStatusBadge = () => {
    if (connectionState === 'LIVE') return (
      <span className="flex items-center text-emerald-400 border border-emerald-900/50 bg-emerald-950/20 px-2 py-1 rounded">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
        ● LIVE BACKEND
      </span>
    );
    if (connectionState === 'RECONNECTING') return (
      <span className="flex items-center text-amber-400 border border-amber-900/50 bg-amber-950/20 px-2 py-1 rounded">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
        ● RECONNECTING...
      </span>
    );
    return (
      <span className="flex items-center text-rose-400 border border-rose-900/50 bg-rose-950/20 px-2 py-1 rounded">
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></span>
        ● BACKEND DISCONNECTED
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020713] text-slate-300 font-sans overflow-hidden selection:bg-purple-500/30 relative">
      <ScrollbarStyles />
      <BackgroundEffects />
      
      <header className="h-8 bg-[#030611]/80 backdrop-blur-md border-b border-[#3b528b]/40 flex items-center justify-between px-3 md:px-4 shrink-0 font-mono text-[9px] md:text-[10px] text-slate-400 tracking-widest uppercase relative z-10">
        <div className="flex items-center space-x-2 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">CLASSIFIED NETWORK MONITORING</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-rose-400 border border-rose-900/50 bg-rose-950/40 px-2 py-0.5 rounded-sm">
          <span>[ RESTRICTED ] CONFIDENTIAL</span>
        </div>
        <div>
          <span className="text-slate-300 whitespace-pre">{formatDateTime(currentTime)}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/70 z-40 md:hidden"></div>
        )}

        <aside className={`absolute md:relative z-50 top-0 bottom-0 left-0 w-[280px] bg-[#040914]/60 backdrop-blur-md border-r border-[#3b528b]/40 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} relative overflow-hidden`}>
          <SidebarBackground />
          <div className="flex flex-col relative z-10 h-full">
            <div className="p-5 md:p-6 flex items-center justify-between border-b border-[#3b528b]/40 bg-[#02050f]/60">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 border border-indigo-500/40 bg-indigo-950/40 rounded">
                  <Shield className="text-purple-400 w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h1 className="text-sm md:text-base font-bold tracking-widest text-slate-100 uppercase">UniShield <span className="text-purple-400">AI</span></h1>
                  <span className="text-[9px] text-slate-400 tracking-widest font-mono uppercase block mt-0.5">PASSIVE THREAT DEFENSE</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <nav className="p-3 space-y-1 mt-2 flex-1">
              <SidebarBtn icon={<Layout />} label="OVERVIEW" active={activePage === 'overview'} onClick={() => navigateTo('overview')} />
              <SidebarBtn icon={<Activity />} label="LIVE THREAT STREAM" badge={events.filter(e=>e.ai_assessment.severity === 'CRITICAL').length.toString()} pulse={pulse} active={activePage === 'stream'} onClick={() => navigateTo('stream')} />
              <SidebarBtn icon={<Crosshair />} label="THREAT ANALYTICS" active={activePage === 'analytics'} onClick={() => navigateTo('analytics')} />
              <SidebarBtn icon={<Terminal />} label="ZEEK CAPTURE LOGS" active={activePage === 'logs'} onClick={() => navigateTo('logs')} />
              <SidebarBtn icon={<Server />} label="SENSOR TELEMETRY" active={activePage === 'telemetry'} onClick={() => navigateTo('telemetry')} />
            </nav>

            <div className="hidden lg:flex flex-col items-center justify-center opacity-80 pointer-events-none px-4 mb-4">
              <div className="text-center">
                <h3 className="text-[10px] font-mono font-bold text-slate-300 tracking-[0.15em] uppercase">National Cyber Defense</h3>
                <p className="text-[9px] font-mono text-slate-400 tracking-[0.25em] uppercase mt-1">Trust &bull; Monitor &bull; Protect</p>
              </div>
            </div>

            <div className="p-4 m-4 rounded border border-[#3b528b]/40 bg-[#060c1c]/70 backdrop-blur-md shrink-0 hidden md:block">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#3b528b]/40 pb-2">
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">Passive Ingest Mode</span>
                  <span className="text-[9px] font-mono text-emerald-400 border border-emerald-900/60 bg-emerald-950/40 px-1.5 py-0.5 rounded shadow-sm">[ RX ONLY ]</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center text-slate-200">
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${connectionState === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                    Kafka Ingest
                  </span>
                  <span className="text-purple-300 font-bold">{connectionState === 'LIVE' ? '18.4K flow/s' : '0 flow/s'}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
          <header className="px-4 md:px-6 py-3 md:py-5 border-b border-[#3b528b]/40 flex items-center justify-between shrink-0 bg-[#050c1b]/70 relative z-10 backdrop-blur-md shadow-md">
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded border border-indigo-900/50 bg-[#0a0f1c] text-purple-400 hover:bg-indigo-900/30">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base md:text-xl font-bold tracking-widest text-slate-100 uppercase drop-shadow-sm">
                  {activePage === 'overview' && 'EXECUTIVE SOC VIEW'}
                  {activePage === 'stream' && 'LIVE THREAT STREAM'}
                  {activePage === 'analytics' && 'THREAT ANALYTICS'}
                  {activePage === 'logs' && 'ZEEK CAPTURE LOGS'}
                  {activePage === 'telemetry' && 'SENSOR TELEMETRY'}
                </h2>
                <p className="hidden md:block text-[10px] font-mono text-indigo-300/80 tracking-widest uppercase mt-1">
                  {activePage === 'overview' && 'REAL-TIME NETWORK THREAT SITUATION | METADATA-ONLY ANALYSIS'}
                  {activePage === 'stream' && 'CONTINUOUS METADATA-ONLY DETECTIONS | LIVE KAFKA FEED'}
                  {activePage === 'analytics' && 'DETECTION BEHAVIOR | MODEL PERFORMANCE | FEATURE CONTRIBUTION'}
                  {activePage === 'logs' && 'RAW SENSOR METADATA | LIVE EVENT STREAM'}
                  {activePage === 'telemetry' && 'HARDWARE NODE STATUS | PIPELINE HEALTH'}
                </p>
              </div>
            </div>
            <div className="text-[9px] md:text-[10px] font-mono text-slate-400 tracking-widest uppercase hidden sm:flex items-center space-x-4">
              <span>Last update: {pad(currentTime.getHours())}:{pad(currentTime.getMinutes())}:{pad(currentTime.getSeconds())}</span>
              {getStatusBadge()}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 relative z-10">
            {connectionState === 'DISCONNECTED' && (
              <div className="mb-4 bg-rose-950/40 border border-rose-900/60 p-4 rounded text-center font-mono backdrop-blur-md">
                <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                <h3 className="text-rose-300 font-bold uppercase tracking-widest text-xs">BACKEND DISCONNECTED</h3>
                <p className="text-slate-300 text-[10px] mt-1 uppercase tracking-widest">WAITING FOR LIVE DATA...</p>
              </div>
            )}
            
            <div className={`flex flex-col space-y-4 md:space-y-5 min-h-full max-w-[1600px] mx-auto pb-6 transition-opacity duration-300 ${connectionState === 'DISCONNECTED' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {activePage === 'overview' && <ExecutiveView events={events} navigateTo={navigateTo} />}
              {activePage === 'stream' && <LiveStreamView events={events} navigateTo={navigateTo} globalSelectedEventId={globalSelectedEventId} setGlobalSelectedEventId={setGlobalSelectedEventId} capabilities={capabilities} />}
              {activePage === 'analytics' && <AnalyticsView events={events} globalSelectedEventId={globalSelectedEventId} navigateTo={navigateTo} capabilities={capabilities} />}
              {activePage === 'logs' && <ZeekLogsView events={events} navigateTo={navigateTo} globalSelectedEventId={globalSelectedEventId} setGlobalSelectedEventId={setGlobalSelectedEventId} capabilities={capabilities} />}
              {activePage === 'telemetry' && <TelemetryView capabilities={capabilities} />}
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

function ExecutiveView({ events, navigateTo }) {
  const totalAlerts = events.length;
  const criticalBreaches = events.filter(e => e.ai_assessment.severity === 'CRITICAL').length;
  
  const avgConf = events.length > 0 
    ? (events.reduce((acc, e) => acc + e.ai_assessment.confidence, 0) / events.length * 100).toFixed(1) + '%'
    : 'N/A';

  const threatCounts = events.reduce((acc, e) => {
    acc[e.ai_assessment.threat_type] = (acc[e.ai_assessment.threat_type] || 0) + 1;
    return acc;
  }, {});
  
  const dynamicThreatDistribution = Object.entries(threatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry, idx) => ({
      name: entry[0],
      value: Math.round((entry[1] / events.length) * 100),
      color: ['#9333ea', '#6366f1', '#4f46e5', '#e11d48', '#8b5cf6'][idx % 5]
    }));

  const activeThreatsCount = events.filter(e => e.ai_assessment.verdict === 'THREAT').length;

  const sourceCounts = events.reduce((acc, e) => {
    if (e.ai_assessment.verdict === 'THREAT') {
      acc[e.src_ip] = (acc[e.src_ip] || 0) + 1;
    }
    return acc;
  }, {});
  
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));
    
  const maxSourceCount = topSources[0]?.count || 1;

  const CustomOverviewTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#030712] border border-[#3b528b]/60 p-2 shadow-2xl rounded-sm font-mono z-[1000] relative">
          <p className="text-[10px] text-slate-200 m-0 flex items-center mb-1">
            <span style={{ backgroundColor: payload[0].payload.color }} className="w-2 h-2 mr-2 inline-block rounded-sm"></span>
            <span className="uppercase tracking-widest text-slate-400">THREAT CLASS</span>
          </p>
          <p className="text-[11px] font-bold text-slate-100">{payload[0].name}</p>
          <p className="text-[10px] text-purple-400 font-bold mt-1">{payload[0].value}% DISTRIBUTION</p>
        </div>
      );
    }
    return null;
  };

  const hourlyBuckets = useMemo(() => {
    const buckets = Array.from({length: 24}, (_, i) => ({
      hourLabel: pad(i),
      events: [],
      maxSeverity: 'NONE'
    }));
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    events.forEach(e => {
      if (now - e.timestamp <= oneDayMs) {
        const h = new Date(e.timestamp).getHours();
        buckets[h].events.push(e);
      }
    });

    const severityRank = { 'NONE': 0, 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    buckets.forEach(b => {
      if (b.events.length > 0) {
        b.maxSeverity = b.events.reduce((max, e) => 
          severityRank[e.ai_assessment.severity] > severityRank[max] ? e.ai_assessment.severity : max
        , 'LOW');
      }
    });
    return buckets;
  }, [events]);

  const [hoveredHex, setHoveredHex] = useState(null);
  const [hoveredThreatClass, setHoveredThreatClass] = useState(null); 

  const RadialTooltip = () => {
    if (!hoveredHex) return null;
    const bucket = hourlyBuckets.find(b => b.hourLabel === hoveredHex);
    if (!bucket) return null;
    
    const critCount = bucket.events.filter(e => e.ai_assessment.severity === 'CRITICAL').length;
    const highCount = bucket.events.filter(e => e.ai_assessment.severity === 'HIGH').length;
    const threatCount = bucket.events.filter(e => e.ai_assessment.verdict === 'THREAT').length;

    const types = bucket.events.reduce((acc, e) => { acc[e.ai_assessment.threat_type] = (acc[e.ai_assessment.threat_type] || 0) + 1; return acc; }, {});
    const topType = Object.entries(types).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
    const peakConf = bucket.events.length > 0 ? Math.max(...bucket.events.map(e => e.ai_assessment.confidence)) : 0;

    return (
      <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-full bg-[#050c1a]/95 backdrop-blur-xl border border-[#3b528b]/60 p-3 shadow-2xl rounded-sm z-[100] font-mono w-56 pointer-events-none mb-4">
        <p className="text-[10px] text-slate-300 uppercase tracking-widest border-b border-[#3b528b]/40 pb-1 mb-2 flex justify-between">
          <span>PAST 24 HOURS</span>
          <span>{bucket.hourLabel}:00 – {pad((parseInt(bucket.hourLabel)+1)%24)}:00</span>
        </p>
        <p className="text-xl text-slate-100 font-light mb-2">{bucket.events.length} EVENTS</p>
        <div className="grid grid-cols-2 gap-1 text-[9px] mb-3 bg-[#02050f]/80 p-1.5 rounded border border-[#3b528b]/40">
          <span className="text-rose-400 font-bold">{critCount} CRITICAL</span>
          <span className="text-orange-400 font-bold">{highCount} HIGH</span>
          <span className="text-purple-300 col-span-2 mt-1 font-bold">{threatCount} TOTAL THREATS</span>
        </div>
        <div className="text-[9px]">
          <span className="block text-slate-400 uppercase tracking-widest">TOP DETECTION</span>
          <span className="block text-slate-200 truncate mb-2 font-bold">{topType}</span>
          <span className="block text-slate-400 uppercase tracking-widest">PEAK AI CONFIDENCE</span>
          <span className="block text-indigo-300 font-bold">{(peakConf * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  const getRadialColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '#ef4444'; 
      case 'HIGH': return '#f97316'; 
      case 'MEDIUM': return '#eab308'; 
      case 'LOW': 
      case 'NONE': 
      default: return '#10b981'; 
    }
  };

  const maxEventsVal = Math.max(...hourlyBuckets.map(b => b.events.length), 1);
  const total24hEvents = hourlyBuckets.reduce((sum, b) => sum + b.events.length, 0);

  const peakBucket = [...hourlyBuckets].sort((a, b) => b.events.length - a.events.length)[0];
  const peakTypes = peakBucket.events.reduce((acc, e) => { acc[e.ai_assessment.threat_type] = (acc[e.ai_assessment.threat_type] || 0) + 1; return acc; }, {});
  const peakTopType = Object.entries(peakTypes).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KpiCard compact title="TOTAL ALERTS (24H)" value={totalAlerts} subtext="Metadata-only detections" icon={<Target />} trend="↑ LIVE" />
        <KpiCard compact title="CRITICAL BREACHES" value={criticalBreaches} subtext="High severity incidents" icon={<AlertTriangle />} trend="↑ LIVE" isCritical />
        <KpiCard compact title="AI CONFIDENCE AVG" value={avgConf} subtext="Across 6 ML classifiers" icon={<Cpu />} trend="↑ LIVE" isPurple />
        <KpiCard compact title="DETECTION LATENCY" value="142 ms" subtext="End-to-end pipeline" icon={<Activity />} trend="↓ -18%" isPurple />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        
        {/* RADAR 24-HOUR CHART PANEL */}
        <div className="flex-1 lg:flex-[0.68] bg-[#050c1a]/75 border border-[#3b528b]/40 flex flex-col relative overflow-visible group min-h-[340px] backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <div className="px-4 py-3 border-b border-[#3b528b]/40 flex justify-between items-center bg-[#02050f]/60 relative z-20">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">PAST 24 HOURS — THREAT ACTIVITY</h3>
            <span className="text-[9px] font-mono border border-emerald-500/40 text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded shadow-sm">[ ROLLING 24H ]</span>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 relative z-10 overflow-visible gap-6">
            
            <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
               <RadialTooltip />
               <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                  
                  {[90, 120, 150].map(r => (
                    <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#3b528b" strokeWidth="1" opacity={r === 150 ? "0.4" : "0.2"} strokeDasharray={r === 150 ? "4 4" : "none"} />
                  ))}
                  
                  {hourlyBuckets.map((_, i) => {
                     const angle = (i * 15 - 90) * (Math.PI / 180);
                     const x1 = 200 + 60 * Math.cos(angle);
                     const x2 = 200 + 160 * Math.cos(angle);
                     const y1 = 200 + 60 * Math.sin(angle);
                     const y2 = 200 + 160 * Math.sin(angle);
                     return <line key={`grid-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b528b" strokeWidth="1" opacity="0.3" />
                  })}

                  <circle cx="200" cy="200" r="60" fill="#02050f" stroke="#3b528b" strokeWidth="2" opacity="0.8" />
                  <text x="200" y="195" textAnchor="middle" fill="#f1f5f9" fontSize="22" fontFamily="monospace" fontWeight="bold">24H</text>
                  <text x="200" y="215" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" letterSpacing="2">THREAT</text>
                  <text x="200" y="230" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" letterSpacing="2">ACTIVITY</text>

                  <polygon 
                    points={hourlyBuckets.map((bucket, i) => {
                      const angle = (i * 15 - 90) * (Math.PI / 180);
                      const valR = 60 + (bucket.events.length / maxEventsVal) * (150 - 60);
                      return `${200 + valR * Math.cos(angle)},${200 + valR * Math.sin(angle)}`;
                    }).join(' ')} 
                    fill="rgba(56, 189, 248, 0.15)" 
                    stroke="#38bdf8" 
                    strokeWidth="1.5" 
                    style={{ filter: `drop-shadow(0 0 8px rgba(56,189,248,0.4))` }} 
                  />

                  {hourlyBuckets.map((bucket, i) => {
                     const angle = (i * 15 - 90) * (Math.PI / 180);
                     const valR = 60 + (bucket.events.length / maxEventsVal) * (150 - 60);
                     const x = 200 + valR * Math.cos(angle);
                     const y = 200 + valR * Math.sin(angle);
                     const color = getRadialColor(bucket.maxSeverity);
                     
                     return (
                       <circle 
                          key={`point-${i}`} 
                          cx={x} 
                          cy={y} 
                          r="3.5" 
                          fill={color} 
                          stroke="#02050f" 
                          strokeWidth="1" 
                          style={{ filter: `drop-shadow(0 0 4px ${color})` }} 
                       />
                     );
                  })}

                  {hourlyBuckets.map((bucket, i) => {
                     const angle = (i * 15 - 90) * (Math.PI / 180);
                     const x1 = 200 + 60 * Math.cos(angle);
                     const x2 = 200 + 160 * Math.cos(angle);
                     const y1 = 200 + 60 * Math.sin(angle);
                     const y2 = 200 + 160 * Math.sin(angle);
                     return (
                       <line 
                          key={`hover-${i}`}
                          x1={x1} y1={y1} x2={x2} y2={y2} 
                          stroke="transparent" 
                          strokeWidth="20"
                          onMouseEnter={() => setHoveredHex(bucket.hourLabel)}
                          onMouseLeave={() => setHoveredHex(null)}
                          onClick={() => navigateTo('stream')}
                          className="cursor-pointer"
                       />
                     );
                  })}

                  {['00', '03', '06', '09', '12', '15', '18', '21'].map(label => {
                      const h = parseInt(label);
                      const angle = (h * 15 - 90) * (Math.PI / 180);
                      const r = 180;
                      const x = 200 + r * Math.cos(angle);
                      const y = 200 + r * Math.sin(angle) + 4; 
                      return <text key={label} x={x} y={y} textAnchor="middle" fill="#cbd5e1" fontSize="14" fontFamily="monospace" fontWeight="bold">{label}</text>
                  })}
               </svg>
            </div>

            <div className="flex flex-col space-y-4 w-full md:w-[180px] shrink-0">
              <div className="bg-[#02050f]/60 border border-[#3b528b]/40 rounded-sm p-3 shadow-inner">
                <h4 className="text-[10px] text-slate-400 font-mono tracking-widest mb-2 uppercase font-bold">Peak Hour</h4>
                <div className="border-l-2 border-rose-500 pl-2">
                   <div className="text-slate-200 font-bold font-mono text-sm">{peakBucket.hourLabel}:00 - {pad((parseInt(peakBucket.hourLabel)+1)%24)}:00</div>
                   <div className="text-indigo-300 font-mono text-[11px] mt-1 font-bold">{peakBucket.events.length} Events</div>
                   <div className="text-slate-400 font-mono text-[10px] mt-0.5 truncate">{peakTopType}</div>
                </div>
              </div>
              
              <div className="bg-[#02050f]/60 border border-[#3b528b]/40 rounded-sm p-3 shadow-inner">
                <h4 className="text-[10px] text-slate-400 font-mono tracking-widest mb-2 uppercase font-bold">Total Events</h4>
                <div className="text-slate-100 font-bold font-mono text-2xl drop-shadow-sm">{total24hEvents.toLocaleString()}</div>
                <div className="text-emerald-400 font-mono text-[10px] mt-1 font-bold">▲ Live Data Active</div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3b528b]/40 mt-2">
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#10b981] mr-1.5 shadow-[0_0_5px_#10b981]"></div><span className="text-[9px] font-mono text-slate-300">Normal</span></div>
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#eab308] mr-1.5 shadow-[0_0_5px_#eab308]"></div><span className="text-[9px] font-mono text-slate-300">Suspicious</span></div>
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#f97316] mr-1.5 shadow-[0_0_5px_#f97316]"></div><span className="text-[9px] font-mono text-slate-300">Attack</span></div>
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-[#ef4444] mr-1.5 shadow-[0_0_5px_#ef4444]"></div><span className="text-[9px] font-mono text-slate-300">Critical</span></div>
              </div>
            </div>

          </div>
        </div>

        {/* THREAT CLASSES */}
        <div className="flex-1 lg:flex-[0.32] bg-[#050c1a]/75 border border-[#3b528b]/40 flex flex-col relative overflow-hidden min-h-[340px] backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <div className="px-4 py-3 border-b border-[#3b528b]/40 bg-[#02050f]/60 relative z-20">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">THREAT CLASSES</h3>
          </div>
          <div className="flex-1 flex flex-col p-4 relative z-10">
            <div className="flex-1 relative min-h-[140px] z-10 flex">
              
              {/* LEFT SIDE TOOLTIP CONTAINER */}
              <div className="absolute top-0 left-0 w-[45%] h-full flex items-center justify-start z-20 pointer-events-none">
                 {hoveredThreatClass && (
                   <div className="bg-[#030712] border border-[#3b528b]/60 p-2 shadow-2xl rounded-sm font-mono w-full max-w-[130px]">
                     <p className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-[#3b528b]/40 pb-1 mb-1 font-bold">THREAT CLASS</p>
                     <p className="text-[10px] font-bold text-slate-100 flex items-center mb-1">
                       <span style={{ backgroundColor: hoveredThreatClass.color }} className="w-2 h-2 mr-1.5 inline-block rounded-sm shadow-sm shrink-0"></span>
                       <span className="truncate">{hoveredThreatClass.name}</span>
                     </p>
                     <p className="text-[9px] text-indigo-300 font-bold">{hoveredThreatClass.value}% DISTRIBUTION</p>
                   </div>
                 )}
              </div>

              {/* RIGHT SIDE PIE CHART */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dynamicThreatDistribution} 
                    cx="65%" 
                    cy="50%" 
                    innerRadius="68%" 
                    outerRadius="90%" 
                    paddingAngle={2} 
                    dataKey="value" 
                    stroke="none" 
                    isAnimationActive={false}
                    onMouseEnter={(data, index) => setHoveredThreatClass(dynamicThreatDistribution[index])}
                    onMouseLeave={() => setHoveredThreatClass(null)}
                  >
                    {dynamicThreatDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER TEXT */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pl-[30%]">
                <span className="text-2xl lg:text-3xl font-mono font-bold text-slate-100 drop-shadow-md">{activeThreatsCount}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Active Threats</span>
              </div>

            </div>
            <div className="mt-4 pt-4 border-t border-[#3b528b]/40 z-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2">
                {dynamicThreatDistribution.map((dist, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono pr-2">
                    <div className="flex items-center truncate">
                      <span className="w-1.5 h-1.5 mr-2 shrink-0 rounded-sm shadow-sm" style={{ backgroundColor: dist.color }}></span>
                      <span className="text-slate-300 truncate w-[85px] xl:w-[95px]">{dist.name}</span>
                    </div>
                    <span className="text-slate-100 font-bold">{dist.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        
        {/* LIVE THREAT FEED */}
        <div className="flex-1 lg:flex-[0.55] bg-[#050c1a]/75 border border-[#3b528b]/40 flex flex-col relative overflow-hidden h-[340px] backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="px-4 py-3 border-b border-[#3b528b]/40 bg-[#02050f]/60 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">LIVE THREAT FEED</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-[9px] text-slate-400 font-mono uppercase bg-[#02050f]/80 sticky top-0 z-10 shadow-sm border-b border-[#3b528b]/40 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-2.5 font-bold">SEVERITY</th>
                  <th className="px-4 py-2.5 font-bold">SOURCE IP</th>
                  <th className="px-4 py-2.5 font-bold">DETECTION</th>
                  <th className="px-4 py-2.5 font-bold">AI VERDICT</th>
                  <th className="px-4 py-2.5 font-bold text-right pr-6">CONF</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {events.slice(0, 50).map((evt) => (
                  <tr key={evt.id} onClick={() => navigateTo('analytics', evt.id)} className="border-b border-[#3b528b]/20 hover:bg-[#3b528b]/20 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <span className="flex items-center text-slate-200">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm ${getSeverityBg(evt.ai_assessment.severity)}`}></span>
                        {evt.ai_assessment.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{evt.src_ip}</td>
                    <td className="px-4 py-3 text-indigo-300 font-bold">{evt.ai_assessment.threat_type}</td>
                    <td className="px-4 py-3 text-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shadow-sm ${evt.ai_assessment.verdict === 'THREAT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                        {evt.ai_assessment.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-bold text-right pr-6">{(evt.ai_assessment.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP THREAT SOURCES */}
        <div className="flex-1 lg:flex-[0.45] bg-[#050c1a]/75 border border-[#3b528b]/40 flex flex-col relative overflow-hidden h-[340px] backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="px-4 py-3 border-b border-[#3b528b]/40 bg-[#02050f]/60 shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">TOP THREAT SOURCES</h3>
          </div>
          <div className="flex-1 p-5 flex flex-col justify-start space-y-4 font-mono overflow-y-auto custom-scrollbar pt-5">
            {topSources.length > 0 ? topSources.map((source, i) => {
              const percentage = (source.count / maxSourceCount) * 100;
              const severity = i === 0 ? 'CRITICAL' : i < 3 ? 'HIGH' : 'MEDIUM';
              const severityStyle = i === 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                                    i < 3 ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
              const barColor = i === 0 ? 'bg-[#e11d48]' : i < 3 ? 'bg-[#ea580c]' : 'bg-[#d97706]';

              return (
                <div key={source.ip} className="flex items-center justify-between text-[10px] font-mono border-b border-[#3b528b]/20 pb-3 last:border-0">
                  <div className="flex items-center space-x-3 w-[35%]">
                    <span className="text-[9px] bg-[#02050f]/80 border border-[#3b528b]/60 text-slate-300 px-1.5 py-0.5 rounded font-bold shadow-sm">{pad(i+1)}</span>
                    <span className="text-slate-200 font-bold">{source.ip}</span>
                  </div>
                  <div className="w-[12%] text-left text-slate-200 font-bold">{source.count}</div>
                  <div className="w-[20%] text-left">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border shadow-sm ${severityStyle}`}>{severity}</span>
                  </div>
                  <div className="w-[33%] bg-[#02050f] border border-[#3b528b]/40 h-2 rounded-sm overflow-hidden flex shadow-inner">
                    <div 
                      className={`h-full rounded-sm transition-all duration-500 shadow-sm ${barColor}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest mt-4">No threat data available</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// LIVE THREAT STREAM VIEW
// ============================================================================
function LiveStreamView({ events, navigateTo, globalSelectedEventId, setGlobalSelectedEventId, capabilities }) {
  
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.ai_assessment.verdict === 'THREAT' && b.ai_assessment.verdict !== 'THREAT') return -1;
      if (a.ai_assessment.verdict !== 'THREAT' && b.ai_assessment.verdict === 'THREAT') return 1;
      const rank = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const rankDiff = rank[b.ai_assessment.severity] - rank[a.ai_assessment.severity];
      if (rankDiff !== 0) return rankDiff;
      return b.timestamp - a.timestamp;
    });
  }, [events]);

  const selectedEvent = sortedEvents.find(e => e.id === globalSelectedEventId) || sortedEvents[0];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 shrink-0">
        {[
          { label: 'CRITICAL', value: events.filter(e=>e.ai_assessment.severity==='CRITICAL').length.toString(), color: 'text-rose-400' },
          { label: 'HIGH', value: events.filter(e=>e.ai_assessment.severity==='HIGH').length.toString(), color: 'text-orange-400' },
          { label: 'MEDIUM', value: events.filter(e=>e.ai_assessment.severity==='MEDIUM').length.toString(), color: 'text-yellow-400' },
          { label: 'EVENTS LOGGED', value: events.length.toString(), color: 'text-slate-100' },
          { label: 'AVG ML CONFIDENCE', value: events.length ? (events.reduce((a,e)=>a+e.ai_assessment.confidence,0)/events.length*100).toFixed(1)+'%' : 'N/A', color: 'text-indigo-300' },
        ].map((card, i) => (
          <div key={i} className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 p-3 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">{card.label}</span>
            <span className={`text-xl font-mono font-bold tracking-tight drop-shadow-sm ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5 shrink-0 min-h-[400px]">
        {/* COMPACT BOUNDED AI PRIORITY QUEUE */}
        <div className="flex-1 lg:flex-[0.65] bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm max-h-[450px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <div className="px-4 py-3 border-b border-[#3b528b]/40 bg-[#02050f]/60 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">AI PRIORITY QUEUE</h3>
            <span className="text-[9px] font-mono text-indigo-300 hover:text-indigo-200 cursor-pointer font-bold">View All →</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-2">
            {sortedEvents.length === 0 && <div className="text-[10px] text-slate-400 font-mono p-4 text-center">Waiting for live data...</div>}
            {sortedEvents.slice(0, 50).map((evt) => {
              const isSelected = evt.id === globalSelectedEventId;
              const isThreat = evt.ai_assessment.verdict === 'THREAT';
              const badgeColor = evt.ai_assessment.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                                 evt.ai_assessment.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                 evt.ai_assessment.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                                 'bg-slate-700/30 text-slate-300 border-slate-500/40';

              return (
                <div 
                  key={evt.id}
                  onClick={() => setGlobalSelectedEventId(evt.id)}
                  className={`flex flex-col p-2.5 font-mono text-[11px] border cursor-pointer transition-colors rounded-sm shadow-sm ${
                    isSelected ? 'bg-indigo-900/30 border-indigo-500/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-[#02050f]/60 border-[#3b528b]/30 hover:border-[#3b528b]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3 truncate pr-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 shadow-sm ${badgeColor}`}>[{evt.ai_assessment.severity}]</span>
                      <div className="truncate">
                        <div className="text-slate-100 font-bold truncate">{evt.ai_assessment.threat_type}</div>
                        <div className="text-[10px] text-slate-400 truncate">{evt.src_ip} → <span className="hidden sm:inline">{evt.dst_ip}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4 text-right shrink-0">
                      <div>
                        <div className={isThreat ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{(evt.ai_assessment.confidence * 100).toFixed(0)}% {evt.ai_assessment.verdict}</div>
                        <div className="text-[9px] text-slate-500 hidden sm:block font-bold">{evt.id}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 w-12 sm:w-16 font-bold">{evt.timeLabel}</span>
                    </div>
                  </div>
                  {capabilities.explainability && (
                    <div className="mt-2 pt-2 border-t border-[#3b528b]/30 text-[9px] text-slate-300 truncate">
                      <span className="font-bold text-indigo-300">AI:</span> {evt.ai_assessment.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* EVENT INSPECTOR */}
        <div className="flex-1 lg:flex-[0.35] bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm max-h-[450px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <div className="px-4 py-3 border-b border-[#3b528b]/40 bg-[#02050f]/60 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">SELECTED EVENT</h3>
            <span className="text-[10px] font-mono text-indigo-300 font-bold">{selectedEvent?.id}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col text-[10px]">
            {selectedEvent ? (
              <>
                <div className="shrink-0">
                  <div className="text-sm md:text-base font-bold text-slate-100 uppercase tracking-wide mb-3 drop-shadow-sm">{selectedEvent.ai_assessment.threat_type}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 text-slate-400 mb-4 pb-3 border-b border-[#3b528b]/40 font-bold">
                    <div>SEVERITY: <span className={getSeverityColor(selectedEvent.ai_assessment.severity)}>{selectedEvent.ai_assessment.severity}</span></div>
                    <div>TIMESTAMP: <span className="text-slate-200">{selectedEvent.timeLabel}</span></div>
                    <div className="sm:col-span-2 truncate">SOURCE: <span className="text-slate-200">{selectedEvent.src_ip}</span></div>
                    <div className="sm:col-span-2 truncate">TARGET: <span className="text-slate-200">{selectedEvent.dst_ip}</span></div>
                    <div>VERDICT: <span className={selectedEvent.ai_assessment.verdict === 'THREAT' ? 'text-rose-400' : 'text-emerald-400'}>{selectedEvent.ai_assessment.verdict}</span></div>
                    <div>CONFIDENCE: <span className="text-indigo-300">{(selectedEvent.ai_assessment.confidence * 100).toFixed(1)}%</span></div>
                  </div>
                </div>

                {/* AI CAPABILITY ADAPTER */}
                <div className="flex flex-col space-y-3 shrink-0 mt-2">
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center drop-shadow-sm">
                    <Cpu className="w-3 h-3 mr-1.5" /> AI THREAT ASSESSMENT
                  </h4>

                  {capabilities.explainability ? (
                    <>
                      <div className="bg-[#02050f]/80 p-2 border border-[#3b528b]/40 rounded text-[9px] shadow-sm">
                          <span className="text-slate-400 block mb-1 uppercase tracking-widest font-bold">Why was this flagged?</span>
                          <p className="text-slate-200 leading-relaxed mb-2 font-bold">{selectedEvent.ai_assessment.explanation}</p>
                          <span className="text-slate-400 block mb-1 uppercase tracking-widest font-bold">Evidence</span>
                          <ul className="list-disc list-inside text-slate-200 space-y-0.5 ml-1 font-bold">
                            {selectedEvent.ai_assessment.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                          </ul>
                      </div>
                      {Object.keys(selectedEvent.ai_assessment.model_consensus).length > 0 && (
                        <div className="bg-[#02050f]/80 p-2 border border-[#3b528b]/40 rounded text-[9px] shadow-sm">
                            <span className="text-slate-400 block mb-1 uppercase tracking-widest font-bold">Model Consensus</span>
                            <div className="space-y-1 mb-2 font-bold">
                              {Object.entries(selectedEvent.ai_assessment.model_consensus).map(([modelKey, data]) => (
                                <div key={modelKey} className="flex justify-between items-center">
                                  <span className="text-slate-300 capitalize">{modelKey.replace('_', ' ')}</span>
                                  <span className="text-slate-200">
                                    <span className={data.verdict === 'THREAT' ? 'text-rose-400' : 'text-emerald-400'}>{data.verdict}</span>
                                    <span className="ml-2 opacity-70">{(data.confidence * 100).toFixed(0)}%</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-[#02050f]/60 p-4 border border-[#3b528b]/30 rounded-sm shadow-inner flex flex-col items-center justify-center text-center opacity-70">
                      <Cpu className="w-5 h-5 text-slate-500 mb-2" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">AI Explanation</span>
                      <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
                    </div>
                  )}

                  {/* MITIGATION CAPABILITY ADAPTER */}
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center drop-shadow-sm mt-4">
                    <Shield className="w-3 h-3 mr-1.5" /> MITIGATION CONTROL
                  </h4>

                  {capabilities.mitigation ? (
                    <div className="bg-indigo-900/20 p-2 border border-indigo-500/40 rounded text-[9px] shadow-sm">
                        <span className="text-slate-400 block mb-0.5 uppercase tracking-widest font-bold">Recommended Action</span>
                        <p className="text-slate-200 mb-3 font-bold">{selectedEvent.ai_assessment.response_status?.action || "Isolate endpoint."}</p>
                        
                        <div className="flex space-x-2">
                           <button className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-400 py-1.5 rounded uppercase font-bold tracking-widest transition-colors">[ APPLY ]</button>
                           <button className="flex-1 bg-[#02050f] hover:bg-[#3b528b]/40 border border-[#3b528b]/60 text-slate-400 hover:text-slate-200 py-1.5 rounded uppercase font-bold tracking-widest transition-colors">[ DISMISS ]</button>
                        </div>
                    </div>
                  ) : (
                    <div className="bg-[#02050f]/60 p-4 border border-[#3b528b]/30 rounded-sm shadow-inner flex flex-col items-center justify-center text-center opacity-70 mb-4">
                      <ShieldAlert className="w-5 h-5 text-slate-500 mb-2" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Mitigation Engine</span>
                      <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
                    </div>
                  )}

                  <button 
                    onClick={() => navigateTo('analytics', selectedEvent.id)}
                    className="w-full mt-2 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/50 text-indigo-200 text-[10px] font-mono font-bold tracking-widest uppercase py-2 rounded transition-all active:scale-[0.98] text-center shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0"
                  >
                    [ VIEW IN THREAT ANALYTICS ]
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[10px] font-mono text-slate-500 font-bold uppercase">Waiting for live data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// THREAT ANALYTICS VIEW
// ============================================================================
function AnalyticsView({ events, globalSelectedEventId, navigateTo, capabilities }) {
  const analyzeRef = useRef(null);
  
  const analyzedEvent = globalSelectedEventId ? events.find(e => e.id === globalSelectedEventId) : null;

  useEffect(() => {
    if (analyzedEvent && analyzeRef.current) {
      analyzeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analyzedEvent]);

  const CustomLatencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050c1a] border border-[#3b528b]/60 p-2 shadow-2xl rounded-sm z-[100]">
          <p className="text-[10px] font-mono text-slate-200 font-bold mb-1 uppercase tracking-widest">{label}</p>
          <p className="text-[10px] font-mono text-indigo-300 m-0 font-bold">Latency: <span className="text-slate-100">{payload[0].value} ms</span></p>
        </div>
      );
    }
    return null;
  };

  const inferenceLatency = [
    { name: 'IsoForest', ms: 18 },
    { name: 'RandForest', ms: 24 },
    { name: 'XGBoost', ms: 31 },
    { name: 'Autoenc', ms: 52 },
    { name: 'LSTM', ms: 87 },
  ];

  const displayFeatures = analyzedEvent ? Object.entries(analyzedEvent.ai_assessment.features_extracted).map(([k, v]) => ({
    name: k.replace(/_/g, ' '),
    value: v === 'HIGH' ? 38 : v === 'MED' ? 18 : 8
  })).sort((a,b) => b.value - a.value) : [
    { name: 'Source Entropy', value: 31 }, { name: 'Arrival Variance', value: 24 }, { name: 'Fan-out Ratio', value: 19 }
  ];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      
      {analyzedEvent && (
        <div ref={analyzeRef} className="bg-[#050c1a]/80 backdrop-blur-md border border-indigo-500/50 p-4 shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.2)] relative overflow-hidden rounded-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
          <div className="flex justify-between items-center border-b border-[#3b528b]/40 pb-3 mb-3 pl-3">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-indigo-300 uppercase flex items-center drop-shadow-sm">
              <ActivitySquare className="w-4 h-4 mr-2" />
              ANALYZING SELECTED EVENT: {analyzedEvent.id}
            </h3>
            <button onClick={() => navigateTo('stream')} className="text-[9px] font-mono text-slate-400 hover:text-slate-200 tracking-widest uppercase transition-colors font-bold">
              ← Back to Stream
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[10px] pl-3">
            <div><span className="text-slate-400 block mb-1 font-bold">THREAT CLASS</span> <span className="text-slate-100 font-bold">{analyzedEvent.ai_assessment.threat_type}</span></div>
            <div><span className="text-slate-400 block mb-1 font-bold">SEVERITY</span> <span className={`${getSeverityBg(analyzedEvent.ai_assessment.severity)} px-1.5 py-0.5 rounded text-white font-bold inline-block shadow-sm`}>{analyzedEvent.ai_assessment.severity}</span></div>
            <div><span className="text-slate-400 block mb-1 font-bold">SOURCE</span> <span className="text-slate-100 font-bold">{analyzedEvent.src_ip}</span></div>
            <div><span className="text-slate-400 block mb-1 font-bold">ML CONFIDENCE</span> <span className="text-emerald-400 font-bold">{(analyzedEvent.ai_assessment.confidence * 100).toFixed(1)}%</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 shrink-0">
        {[
          { label: 'ACTIVE ML MODELS', value: '6' },
          { label: 'AVG ACCURACY', value: '96.8%' },
          { label: 'AVG INFERENCE', value: '42 ms' },
          { label: 'FLOWS ANALYZED', value: '1.8M' },
          { label: 'MODEL DRIFT', value: 'NORMAL', isGreen: true }
        ].map((metric, i) => (
          <div key={i} className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 p-3 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-bold tracking-tight drop-shadow-sm ${metric.isGreen ? 'text-emerald-400' : 'text-slate-100'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[260px]">
        {/* EXPLAINABILITY CAPABILITY ADAPTER */}
        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="flex flex-col border-b border-[#3b528b]/40 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">
              EVENT FEATURE EXPLANATION
            </h3>
            <span className="text-[9px] font-mono text-indigo-400/80 tracking-widest uppercase mt-0.5 font-bold">
              NORMALIZED CONTRIBUTION
            </span>
          </div>
          {capabilities.explainability ? (
            <div className="flex-1 flex flex-col justify-between space-y-2 lg:space-y-0">
              {displayFeatures.map((feat) => (
                <div key={feat.name} className="flex items-center">
                  <span className="w-32 md:w-36 text-[10px] font-mono text-slate-300 uppercase tracking-widest truncate font-bold">{feat.name}</span>
                  <div className="flex-1 mx-3 bg-[#02050f] h-2 border border-[#3b528b]/40 rounded-sm shadow-inner">
                    <div className="bg-indigo-500/80 h-full transition-all duration-500 rounded-sm shadow-sm" style={{ width: `${feat.value}%` }}></div>
                  </div>
                  <span className="w-8 text-right text-[10px] font-mono text-slate-200 font-bold">{feat.value}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <Cpu className="w-6 h-6 text-slate-500 mb-2" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">AI Explainability</span>
              <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
            </div>
          )}
        </div>

        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="flex flex-col border-b border-[#3b528b]/40 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">MODEL INFERENCE LATENCY</h3>
            <span className="text-[9px] font-mono text-indigo-400/80 tracking-widest uppercase mt-0.5 font-bold">LOWER IS BETTER</span>
          </div>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inferenceLatency} margin={{ top: 25, right: 10, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} fill="transparent" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#cbd5e1', fontWeight: 600}} interval={0} fontFamily="monospace" dy={10} />
                <YAxis ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} tickFormatter={(val) => `${val} ms`} fontFamily="monospace" width={45} />
                <RechartsTooltip content={<CustomLatencyTooltip />} cursor={false} />
                <ReferenceLine y={42} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.8}>
                  <Label value="AVG 42 ms" position="insideTopLeft" fill="#94a3b8" fontSize={9} fontFamily="monospace" offset={6} fontWeight={600} />
                </ReferenceLine>
                <Bar dataKey="ms" radius={[4, 4, 0, 0]} maxBarSize={38}>
                  {inferenceLatency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'LSTM' ? '#e11d48' : '#6366f1'} />
                  ))}
                  <LabelList dataKey="ms" position="top" fill="#f1f5f9" fontSize={10} fontFamily="monospace" formatter={(val) => `${val} ms`} offset={8} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 flex-1 min-h-[160px] mt-4">
        {/* CORRELATION CAPABILITY ADAPTER */}
        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-4 drop-shadow-sm">
            CORRELATED ACTIVITY INCIDENTS
          </h3>
          {capabilities.correlation ? (
            <div className="flex-1 flex flex-col justify-center space-y-3">
              {/* Correlation rendering would go here */}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <Link className="w-6 h-6 text-slate-500 mb-2" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Attack Correlation Engine</span>
              <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
            </div>
          )}
        </div>

        {/* REPLAY CAPABILITY ADAPTER (Replaced Model Health) */}
        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-4 drop-shadow-sm">
            INCIDENT TIMELINE & REPLAY
          </h3>
          {capabilities.replay ? (
            <div className="flex-1 flex flex-col justify-center">
              {/* Replay timeline rendering would go here */}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <Play className="w-6 h-6 text-slate-500 mb-2" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Historical Attack Replay</span>
              <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZEEK LOGS VIEW 
// ============================================================================
function ZeekLogsView({ events, navigateTo, globalSelectedEventId, setGlobalSelectedEventId, capabilities }) {
  
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterProtocol, setFilterProtocol] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copyStatus, setCopyStatus] = useState('idle');

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterSource !== 'ALL' && e.log_source !== filterSource) return false;
      if (filterSeverity !== 'ALL' && e.ai_assessment.severity !== filterSeverity) return false;
      if (filterProtocol !== 'ALL' && e.raw_event?.proto?.toUpperCase() !== filterProtocol.toUpperCase()) return false;
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        return (
          e.src_ip.includes(sq) || 
          e.dst_ip?.includes(sq) || 
          e.id.toLowerCase().includes(sq) || 
          e.ai_assessment.threat_type.toLowerCase().includes(sq) ||
          e.log_source.toLowerCase().includes(sq)
        );
      }
      return true;
    });
  }, [events, filterSource, filterSeverity, filterProtocol, searchQuery]);

  const availableSources = useMemo(() => Array.from(new Set(events.map(e => e.log_source))).sort(), [events]);
  const availableProtocols = useMemo(() => Array.from(new Set(events.map(e => e.raw_event?.proto?.toUpperCase()).filter(Boolean))).sort(), [events]);

  const selectedEvent = events.find(e => e.id === globalSelectedEventId) || filteredEvents[0] || events[0];

  const handleCopyEvent = async () => {
    if (!selectedEvent?.raw_event) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedEvent.raw_event, null, 2));
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 1800);
    } catch (error) {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 1800);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-mono">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'EVENTS / SEC', value: '18.4K' },
          { label: 'CONNECTIONS', value: '12,804' },
          { label: 'DNS EVENTS', value: '4,921' },
          { label: 'SECURITY NOTICES', value: '6', color: 'text-emerald-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 p-3 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">{stat.label}</span>
            <span className={`text-xl font-bold tracking-tight drop-shadow-sm ${stat.color || 'text-slate-100'}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 p-2 md:p-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between text-[10px] uppercase tracking-widest text-slate-300 gap-3 md:gap-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm font-bold">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value)}
              className="bg-[#02050f] border border-[#3b528b]/60 text-slate-200 px-2 py-1 rounded cursor-pointer hover:border-indigo-400 outline-none uppercase tracking-widest appearance-none shadow-sm"
            >
              <option value="ALL">LOG SOURCE: ALL ▼</option>
              {availableSources.map(src => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          
          <select 
            value={filterSeverity} 
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-[#02050f] border border-[#3b528b]/60 text-slate-200 px-2 py-1 rounded cursor-pointer hover:border-indigo-400 outline-none uppercase tracking-widest appearance-none shadow-sm"
          >
            <option value="ALL">SEVERITY: ALL ▼</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select 
            value={filterProtocol} 
            onChange={e => setFilterProtocol(e.target.value)}
            className="bg-[#02050f] border border-[#3b528b]/60 text-slate-200 px-2 py-1 rounded cursor-pointer hover:border-indigo-400 outline-none uppercase tracking-widest appearance-none shadow-sm"
          >
            <option value="ALL">PROTOCOL: ALL ▼</option>
            {availableProtocols.map(proto => <option key={proto} value={proto}>{proto}</option>)}
          </select>
          
          <div className="flex items-center bg-[#02050f] border border-[#3b528b]/60 rounded px-2 py-1 min-w-[200px] shadow-inner">
            <Search className="w-3 h-3 mr-2 text-indigo-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search IP, UID, Threat..." 
              className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-full font-sans text-xs" 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {(filterSource !== 'ALL' || filterSeverity !== 'ALL' || filterProtocol !== 'ALL' || searchQuery) && (
            <button 
              onClick={() => { setFilterSource('ALL'); setFilterSeverity('ALL'); setFilterProtocol('ALL'); setSearchQuery(''); }}
              className="text-rose-400 hover:text-rose-300 tracking-widest font-bold"
            >
              [ RESET ]
            </button>
          )}
          <span className="text-slate-300 bg-[#02050f] border border-[#3b528b]/60 px-2 py-1 rounded cursor-pointer hover:border-indigo-400 shadow-sm">Last 15 min ▼</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 shrink-0 min-h-[450px]">
        {/* COMPACT BOUNDED ZEEK EVENT STREAM */}
        <div className="flex-1 lg:flex-[0.60] bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm max-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-[#3b528b]/40 bg-[#02050f]/60 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase drop-shadow-sm">LIVE ZEEK EVENT STREAM</h3>
            <span className="text-[9px] text-indigo-300 font-bold">{filteredEvents.length} MATCHING EVENTS</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#02050f]/40 p-3 space-y-2.5 text-[11px] leading-relaxed relative z-10">
            {filteredEvents.length > 0 ? filteredEvents.slice(0, 100).map((evt) => (
              <div 
                key={evt.id}
                onClick={() => setGlobalSelectedEventId(evt.id)}
                className={`p-2.5 border-l-2 cursor-pointer transition-colors rounded-sm shadow-sm ${
                  globalSelectedEventId === evt.id ? 'bg-indigo-900/30 border-indigo-500' : 'border-transparent hover:bg-[#3b528b]/30'
                }`}
              >
                <div className="flex items-center space-x-3 mb-1 font-bold">
                  <span className="text-slate-400">{evt.timeLabel}</span>
                  <span className={`${getSeverityColor(evt.ai_assessment.severity)}`}>[{evt.log_source}]</span>
                </div>
                <div className="text-slate-200 mb-1 font-bold">
                  <span className="text-indigo-300 mr-3">{evt.id}</span>
                  {evt.src_ip} {evt.dst_ip && <span className="text-slate-400">→ {evt.dst_ip}:{evt.ports}</span>}
                </div>
                <div className="text-slate-300 whitespace-pre-wrap font-bold">
                  {evt.ai_assessment.threat_type} ({evt.raw_event?.proto})
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full text-slate-500 tracking-widest uppercase text-[10px] font-bold">No events match filters</div>
            )}
          </div>
        </div>

        {/* EVENT INSPECTOR */}
        <div className="flex-1 lg:flex-[0.40] bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm max-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-[#3b528b]/40 bg-[#02050f]/60 shrink-0">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">EVENT INSPECTOR</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col text-[10px] relative z-10">
            {selectedEvent ? (
              <>
                <div className="shrink-0">
                  <div className="text-sm md:text-base font-bold text-slate-100 uppercase tracking-wide mb-3 drop-shadow-sm">{selectedEvent.ai_assessment.threat_type}</div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                    <div><span className="text-slate-400 block mb-0.5 font-bold">EVENT TYPE</span> <span className="text-slate-100 font-bold">{selectedEvent.ai_assessment.threat_type}</span></div>
                    <div><span className="text-slate-400 block mb-0.5 font-bold">LOG SOURCE</span> <span className="text-slate-200 font-bold">{selectedEvent.log_source}</span></div>
                    <div><span className="text-slate-400 block mb-0.5 font-bold">TIMESTAMP</span> <span className="text-slate-200 font-bold">{selectedEvent.timeLabel}</span></div>
                    <div><span className="text-slate-400 block mb-0.5 font-bold">CONNECTION UID</span> <span className="text-indigo-300 font-bold">{selectedEvent.id}</span></div>
                    <div><span className="text-slate-400 block mb-0.5 font-bold">SOURCE IP</span> <span className="text-slate-200 font-bold">{selectedEvent.src_ip}</span></div>
                    <div><span className="text-slate-400 block mb-0.5 font-bold">DESTINATION</span> <span className="text-slate-200 font-bold">{selectedEvent.dst_ip}:{selectedEvent.ports}</span></div>
                  </div>
                </div>

                <div className="flex space-x-2 mb-4 pb-4 border-b border-[#3b528b]/40 shrink-0">
                  <button 
                    onClick={handleCopyEvent}
                    disabled={!selectedEvent.raw_event}
                    className="flex-1 flex items-center justify-center bg-[#02050f] border border-[#3b528b]/60 hover:border-indigo-400 hover:bg-[#3b528b]/20 text-slate-200 font-bold py-2 rounded transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {copyStatus === 'success' ? 'COPIED ✓' : copyStatus === 'error' ? 'COPY FAILED' : <><Copy className="w-3 h-3 mr-2" /> COPY EVENT</>}
                  </button>
                  <button 
                    onClick={() => navigateTo('stream', selectedEvent.id)}
                    className="flex-1 flex items-center justify-center bg-indigo-900/30 border border-indigo-500/50 hover:bg-indigo-900/50 text-indigo-200 font-bold py-2 rounded transition-colors uppercase tracking-widest shadow-sm"
                  >
                    <ActivitySquare className="w-3 h-3 mr-2" /> THREAT STREAM
                  </button>
                </div>

                <div className="flex flex-col space-y-3 shrink-0">
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center drop-shadow-sm">
                    <Cpu className="w-3 h-3 mr-1.5" /> AI THREAT ASSESSMENT
                  </h4>

                  {/* AI CAPABILITY ADAPTER */}
                  {capabilities.explainability ? (
                    <>
                      <div className="bg-[#02050f]/80 p-2 border border-[#3b528b]/40 rounded text-[9px] shadow-sm">
                          <span className="text-slate-400 block mb-1 uppercase tracking-widest font-bold">Why was this flagged?</span>
                          <p className="text-slate-200 leading-relaxed mb-2 font-bold">{selectedEvent.ai_assessment.explanation}</p>
                          <span className="text-slate-400 block mb-1 uppercase tracking-widest font-bold">Evidence</span>
                          <ul className="list-disc list-inside text-slate-200 space-y-0.5 ml-1 font-bold">
                            {selectedEvent.ai_assessment.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                          </ul>
                      </div>
                      {Object.keys(selectedEvent.ai_assessment.model_consensus).length > 0 && (
                        <div className="bg-[#02050f]/80 p-2 border border-[#3b528b]/40 rounded text-[9px] shadow-sm">
                            <span className="text-slate-400 block mb-1 uppercase tracking-widest font-bold">Model Consensus</span>
                            <div className="space-y-1 mb-2 font-bold">
                              {Object.entries(selectedEvent.ai_assessment.model_consensus).map(([modelKey, data]) => (
                                <div key={modelKey} className="flex justify-between items-center">
                                  <span className="text-slate-300 capitalize">{modelKey.replace('_', ' ')}</span>
                                  <span className="text-slate-200">
                                    <span className={data.verdict === 'THREAT' ? 'text-rose-400' : 'text-emerald-400'}>{data.verdict}</span>
                                    <span className="ml-2 opacity-70">{(data.confidence * 100).toFixed(0)}%</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-[#02050f]/60 p-4 border border-[#3b528b]/30 rounded-sm shadow-inner flex flex-col items-center justify-center text-center opacity-70">
                      <Cpu className="w-5 h-5 text-slate-500 mb-2" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">AI Explanation</span>
                      <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
                    </div>
                  )}

                  {/* MITIGATION CAPABILITY ADAPTER */}
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center drop-shadow-sm mt-4">
                    <Shield className="w-3 h-3 mr-1.5" /> MITIGATION CONTROL
                  </h4>

                  {capabilities.mitigation ? (
                    <div className="bg-indigo-900/20 p-2 border border-indigo-500/40 rounded text-[9px] shadow-sm">
                        <span className="text-slate-400 block mb-0.5 uppercase tracking-widest font-bold">Recommended Action</span>
                        <p className="text-slate-200 mb-3 font-bold">{selectedEvent.ai_assessment.response_status?.action || "Isolate endpoint."}</p>
                        
                        <div className="flex space-x-2">
                           <button className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-400 py-1.5 rounded uppercase font-bold tracking-widest transition-colors">[ APPLY ]</button>
                           <button className="flex-1 bg-[#02050f] hover:bg-[#3b528b]/40 border border-[#3b528b]/60 text-slate-400 hover:text-slate-200 py-1.5 rounded uppercase font-bold tracking-widest transition-colors">[ DISMISS ]</button>
                        </div>
                    </div>
                  ) : (
                    <div className="bg-[#02050f]/60 p-4 border border-[#3b528b]/30 rounded-sm shadow-inner flex flex-col items-center justify-center text-center opacity-70 mb-4">
                      <ShieldAlert className="w-5 h-5 text-slate-500 mb-2" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Mitigation Engine</span>
                      <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
                    </div>
                  )}

                  <button 
                    onClick={() => navigateTo('analytics', selectedEvent.id)}
                    className="w-full mt-2 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/50 text-indigo-200 text-[10px] font-mono font-bold tracking-widest uppercase py-2 rounded transition-all active:scale-[0.98] text-center shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0"
                  >
                    [ VIEW IN THREAT ANALYTICS ]
                  </button>

                  <div className="mt-4 pt-2 border-t border-[#3b528b]/40 shrink-0">
                    <span className="text-slate-400 block mb-2 uppercase tracking-widest font-bold">RAW EVENT</span>
                    <pre className="bg-[#02050f]/80 border border-[#3b528b]/40 p-3 rounded text-[10px] text-indigo-300/80 overflow-x-auto whitespace-pre-wrap word-break-all font-bold shadow-inner">
                      {JSON.stringify(selectedEvent.raw_event, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Waiting for live data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryView({ capabilities }) {
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
          <div key={i} className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 p-3 flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-sm">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1 font-bold">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-bold tracking-tight drop-shadow-sm ${metric.isGreen ? 'text-emerald-400' : 'text-slate-100'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[220px]">
        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-4 drop-shadow-sm">COMPUTE UTILIZATION</h3>
          <div className="flex-1 flex flex-col justify-between space-y-2 lg:space-y-0">
            {computeStats.map((stat, i) => (
              <div key={i} className="flex items-center">
                <span className="w-20 md:w-28 text-[9px] md:text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">{stat.label}</span>
                <div className="flex-1 mx-2 md:mx-3 bg-[#02050f] h-2 border border-[#3b528b]/40 rounded-sm shadow-inner">
                  <div className={`${stat.color} h-full rounded-sm shadow-sm`} style={{ width: `${stat.percentage}%` }}></div>
                </div>
                <span className="w-16 md:w-20 text-right text-[9px] md:text-[10px] font-mono text-slate-200 font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-4 drop-shadow-sm">SENSOR NODE STATUS</h3>
          <div className="flex-1 flex flex-col justify-center space-y-3 md:space-y-4">
            {nodeStatus.map((node, i) => (
              <div key={i} className="flex items-center justify-between font-mono text-[10px] md:text-[11px] font-bold">
                <div className="flex items-center text-slate-200">
                  <span className={`w-1.5 h-1.5 rounded-full mr-3 shadow-sm ${node.icon} animate-pulse`}></span>
                  {node.name}
                </div>
                <span className="text-emerald-400 tracking-widest drop-shadow-sm">{node.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 p-4 shrink-0 flex flex-col relative overflow-hidden hidden sm:flex shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
        <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-6 drop-shadow-sm">DATA PIPELINE</h3>
        <div className="grid grid-cols-3 lg:flex lg:items-center lg:justify-between gap-y-6 px-2 lg:px-8 pb-4">
          {pipelineFlow.map((stage, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center space-y-2 md:space-y-3">
                <span className="text-[9px] md:text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">{stage.name}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] border border-indigo-300"></span>
                <span className={`text-[9px] md:text-[10px] font-mono font-bold ${stage.isEnd ? 'text-rose-400 drop-shadow-sm' : 'text-slate-200'}`}>{stage.rate}</span>
              </div>
              {i < pipelineFlow.length - 1 && (
                <div className="hidden lg:flex flex-1 items-center justify-center -mt-6 opacity-60">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 flex-1 min-h-[200px]">
        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-2 drop-shadow-sm">TELEMETRY THROUGHPUT</h3>
          <div className="flex-1 min-h-[120px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" fontWeight="bold" />
                <YAxis domain={[17, 19]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}K`} fontFamily="monospace" fontWeight="bold" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#02050f', border: '1px solid #3b528b', fontSize: '11px', fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold' }} formatter={(value) => [`${value}K/s`, 'Rate']} />
                <Area type="monotone" dataKey="rate" stroke="#818cf8" strokeWidth={2} fill="url(#colorRate)" activeDot={{ r: 4, fill: '#818cf8', stroke: '#0f172a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIMULATION CAPABILITY ADAPTER */}
        <div className="bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase border-b border-[#3b528b]/40 pb-3 mb-3 drop-shadow-sm">CONTROLLED DDOS SIMULATION</h3>
          
          {capabilities.simulation ? (
            <div className="flex-1 flex flex-col justify-center">
              {/* Simulation controls would render here */}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <Zap className="w-6 h-6 text-slate-500 mb-2" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Controlled Simulation Mode</span>
              <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mt-1">Backend Capability Unavailable</span>
            </div>
          )}
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
      className={`w-full flex items-center justify-between px-4 py-3 font-mono text-[10px] tracking-widest transition-all font-bold ${
      active 
        ? 'bg-indigo-900/30 text-indigo-300 border-l-2 border-indigo-400 shadow-sm' 
        : 'text-slate-400 hover:bg-[#02050f]/40 hover:text-slate-200 border-l-2 border-transparent'
    }`}>
      <div className="flex items-center space-x-3">
        <span className="w-3.5 h-3.5 opacity-90 shrink-0 drop-shadow-sm">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className={`px-1.5 py-0.5 rounded border shrink-0 shadow-sm ${
          active ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/50' : 'bg-[#02050f] text-slate-300 border-slate-700'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function KpiCard({ title, value, subtext, icon, trend, isCritical, isPurple, compact }) {
  let iconColor = 'text-slate-400';
  let valueColor = 'text-slate-100';
  let trendColor = trend.includes('↑') && !isCritical ? 'text-emerald-400' : 
                   trend.includes('↓') ? 'text-emerald-400' : 'text-rose-400';

  if (isCritical) {
    iconColor = 'text-rose-500';
    valueColor = 'text-rose-400';
  } else if (isPurple) {
    iconColor = 'text-indigo-400';
    valueColor = 'text-indigo-300';
  }

  return (
    <div className={`bg-[#050c1a]/75 backdrop-blur-md border border-[#3b528b]/40 flex flex-col relative overflow-hidden group min-h-[110px] shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm ${compact ? 'p-3' : 'p-3 md:p-4'}`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className={`flex justify-between items-start ${compact ? 'mb-1' : 'mb-2 md:mb-3'}`}>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono truncate mr-2 drop-shadow-sm">{title}</span>
        <div className={`${iconColor} shrink-0 drop-shadow-md`}>{icon}</div>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col">
          <div className={`text-2xl lg:text-3xl font-bold font-mono tracking-tight leading-none mb-1 drop-shadow-sm ${valueColor}`}>{value}</div>
          <div className="text-[9px] md:text-[10px] text-slate-400 font-mono font-bold truncate max-w-[120px] sm:max-w-[160px]">{subtext}</div>
        </div>
        {trend && (
          <div className={`text-[9px] md:text-[10px] font-mono font-bold shrink-0 drop-shadow-sm ${trendColor}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}