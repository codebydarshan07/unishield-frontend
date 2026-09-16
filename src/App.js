import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList, ReferenceLine, Label
} from 'recharts';
import { 
  Shield, Activity, AlertTriangle, Crosshair, 
  Layout, Terminal, Server, Cpu, 
  Target, ShieldAlert,
  Search, ArrowRight, Menu, X, Filter, Copy, ActivitySquare, CheckCircle, Clock, XCircle
} from 'lucide-react';

// ============================================================================
// GLOBAL SCROLLBAR STYLES (Keeps panels clean and bounded)
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
    case 'CRITICAL': return 'bg-rose-500 text-white';
    case 'HIGH': return 'bg-orange-500 text-white';
    case 'MEDIUM': return 'bg-yellow-500 text-slate-900';
    case 'LOW': return 'bg-purple-500 text-white';
    case 'INFO': return 'bg-slate-700 text-slate-200';
    default: return 'bg-[#060913] text-slate-500 border border-slate-800';
  }
};

// ============================================================================
// LIVE BACKEND ADAPTER (Simulates Real Backend Data Contract)
// ============================================================================
function useLiveBackend() {
  const [events, setEvents] = useState([]);
  const [connectionState, setConnectionState] = useState('CONNECTING');

  useEffect(() => {
    let isMounted = true;
    
    setTimeout(() => {
      if (!isMounted) return;
      const initialEvents = generateHistoricalBackendEvents();
      setEvents(initialEvents);
      setConnectionState('LIVE');
    }, 1000);

    const streamInterval = setInterval(() => {
      if (!isMounted) return;
      
      const newEvent = createBackendEventContract(new Date());
      setEvents(prev => {
        const updated = [newEvent, ...prev].slice(0, 2000);
        return updated;
      });

      if (Math.random() < 0.01) {
        setConnectionState('DISCONNECTED');
        setTimeout(() => isMounted && setConnectionState('RECONNECTING'), 3000);
        setTimeout(() => isMounted && setConnectionState('LIVE'), 6000);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(streamInterval);
    };
  }, []);

  return { events, connectionState };
}

function createBackendEventContract(dateObj) {
  const isThreat = Math.random() > 0.35;
  const isCritical = isThreat && Math.random() > 0.85;
  const severity = isCritical ? 'CRITICAL' : isThreat ? (Math.random() > 0.6 ? 'HIGH' : 'MEDIUM') : 'LOW';
  
  const threatTypes = ['Port Scan', 'DGA / DNS Anomaly', 'Beaconing', 'Anomalous Flow', 'Mismatched Cert'];
  const type = isThreat ? threatTypes[Math.floor(Math.random() * threatTypes.length)] : 'Normal Traffic';
  const srcIp = `10.24.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 255)}`;
  const eventId = `EVT-${Math.floor(Math.random() * 90000) + 10000}`;
  const logSource = Math.random() > 0.5 ? 'conn.log' : Math.random() > 0.5 ? 'dns.log' : 'ssl.log';
  const proto = ['TCP', 'UDP', 'ICMP', 'DNS'][Math.floor(Math.random() * 4)];
  
  // Randomize actual neutralization status for realistic SOC testing
  const responseStates = ['NEUTRALIZED', 'ACTION PENDING', 'FAILED'];
  const rState = isThreat ? responseStates[Math.floor(Math.random() * responseStates.length)] : null;

  return {
    id: eventId,
    timestamp: dateObj.getTime(),
    timeLabel: `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`,
    log_source: logSource,
    src_ip: srcIp,
    dst_ip: `198.51.100.${Math.floor(Math.random() * 255)}`,
    ports: [53, 80, 443, 8080, 22][Math.floor(Math.random() * 5)],
    
    ai_assessment: {
      threat_type: type,
      severity: severity,
      verdict: isThreat ? 'THREAT' : 'FALSE POSITIVE',
      confidence: isThreat ? (0.88 + Math.random() * 0.11) : (0.75 + Math.random() * 0.20),
      explanation: isThreat 
        ? `AI detected abnormal behavior because the source host triggered multiple anomaly thresholds. The observed traffic pattern strongly correlates with known ${type} signatures and deviates significantly from the 30-day historical baseline.`
        : `Traffic initially matched suspicious heuristics, but deep AI analysis determined this is consistent with authorized internal synchronization protocols. No anomalous payload detected.`,
      evidence: isThreat ? [
        "Connection frequency exceeds baseline by 400%",
        "High port fan-out ratio detected",
        "Payload entropy matches automated script generation",
        "Source IP lacks previous operational history"
      ] : [
        "Destination is a known internal service",
        "Connection frequency matches established cron timing",
        "Payload signatures match normal operational traffic"
      ],
      model_consensus: {
        isolation_forest: { verdict: isThreat ? 'THREAT' : 'FALSE POSITIVE', confidence: 0.92 },
        random_forest: { verdict: isThreat ? 'THREAT' : 'FALSE POSITIVE', confidence: 0.94 },
        xgboost: { verdict: isThreat ? 'THREAT' : 'THREAT', confidence: 0.81 },
        autoencoder: { verdict: 'FALSE POSITIVE', confidence: 0.88 },
      },
      response_status: isThreat ? {
        state: rState,
        action: rState === 'NEUTRALIZED' ? `Source IP ${srcIp} automatically blocked at boundary firewall.` : 
                rState === 'FAILED' ? `Attempted to block ${srcIp} but edge router timed out.` :
                `Recommend isolating host ${srcIp} and analyzing endpoint telemetry.`,
        response_time: rState === 'NEUTRALIZED' ? `${Math.floor(Math.random() * 150) + 50}ms` : null
      } : null,
      features_extracted: {
        entropy: isThreat ? 'HIGH' : 'LOW',
        arrival_variance: isThreat ? 'HIGH' : 'MED',
        fan_out: isThreat ? 'HIGH' : 'LOW',
        payload_variance: 'MED'
      }
    },
    raw_event: {
      "ts": dateObj.getTime() / 1000,
      "uid": eventId,
      "id.orig_h": srcIp,
      "id.orig_p": Math.floor(Math.random() * 65000),
      "id.resp_h": "198.51.100.4",
      "id.resp_p": 443,
      "proto": proto,
      "conn_state": "S0",
      "orig_bytes": 0,
      "resp_bytes": 0
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
// VISIBLE PREMIUM SOC BACKGROUND EFFECTS
// ============================================================================
const BackgroundEffects = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#030611]">
    
    {/* LAYER 4: ATMOSPHERIC DEPTH & GRID */}
    <div className="absolute inset-0 opacity-70" style={{
      background: `
        radial-gradient(circle at 85% 15%, rgba(67, 56, 202, 0.4) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 15% 85%, rgba(79, 70, 229, 0.3) 0%, transparent 40%)
      `
    }} />
    <div className="absolute inset-0 opacity-50 mix-blend-overlay" style={{
      backgroundImage: `linear-gradient(rgba(129, 140, 248, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(129, 140, 248, 0.2) 1px, transparent 1px)`,
      backgroundSize: '48px 48px'
    }} />

    {/* LAYER 3 & 2: CIRCUIT TRACES & CYBER NETWORK TOPOLOGY */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.3]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="soc-cyber-pattern" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          {/* Circuit Traces */}
          <path d="M 0 40 L 40 40 L 60 60 L 120 60 L 140 80 L 180 80" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.8" />
          <circle cx="180" cy="80" r="3" fill="#818cf8" opacity="1" />
          
          <path d="M 400 280 L 360 280 L 320 240 L 260 240 L 240 220 L 200 220" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.7" />
          <circle cx="200" cy="220" r="2.5" fill="#a78bfa" opacity="1" />

          <path d="M 80 400 L 80 360 L 120 320 L 120 280 L 140 260 L 180 260" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
          <circle cx="180" cy="260" r="2" fill="#6366f1" opacity="1" />

          {/* Network Topology Nodes */}
          <path d="M 280 120 L 320 100 L 340 140 L 300 160 Z" fill="none" stroke="#c084fc" strokeWidth="1" opacity="0.6" />
          <circle cx="280" cy="120" r="3.5" fill="#c084fc" />
          <circle cx="320" cy="100" r="2" fill="#c084fc" />
          <circle cx="340" cy="140" r="4" fill="#c084fc" />
          <circle cx="300" cy="160" r="3" fill="#c084fc" />
          
          {/* Data flow lines */}
          <path d="M 0 320 C 100 320, 150 360, 200 360 S 300 320, 400 320" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 12" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#soc-cyber-pattern)" />
    </svg>

    {/* LAYER 1: LARGE UNISHIELD WATERMARK */}
    <div className="absolute top-[40%] right-[10%] transform -translate-y-1/2 flex flex-col items-center justify-center opacity-[0.12] mix-blend-screen pointer-events-none">
      <Shield className="w-[70vh] h-[70vh] text-indigo-300" strokeWidth={0.5} />
      <div className="font-mono text-[3.5vh] tracking-[0.6em] text-indigo-300 mt-6 font-bold uppercase drop-shadow-[0_0_10px_rgba(165,180,252,0.8)]">UNISHIELD AI</div>
      <div className="font-mono text-[1.5vh] tracking-[0.4em] text-indigo-400 mt-2 font-light uppercase opacity-80">TRUST • MONITOR • PROTECT</div>
    </div>
  </div>
);

const SidebarBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.15]">
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sidebar-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 0 20 L 20 20 L 40 40 L 60 40" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.7" />
          <circle cx="60" cy="40" r="1.5" fill="#818cf8" />
          <path d="M 100 80 L 80 80 L 60 60 L 40 60" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
          <circle cx="40" cy="60" r="1.5" fill="#a78bfa" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sidebar-pattern)" />
    </svg>
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-20">
      <Shield className="w-48 h-48 text-indigo-500" strokeWidth={0.5} />
    </div>
  </div>
);

// ============================================================================
// MAIN APPLICATION SHELL & ROUTING ENGINE
// ============================================================================
export default function UniShieldDashboard() {
  const [pulse, setPulse] = useState(false);
  const [activePage, setActivePage] = useState('overview'); 
  const [globalSelectedEventId, setGlobalSelectedEventId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { events, connectionState } = useLiveBackend();
  
  useEffect(() => {
    const interval = setInterval(() => setPulse(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        setActivePage(e.state.page || 'overview');
        if (e.state.eventId) setGlobalSelectedEventId(e.state.eventId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ page: activePage, eventId: globalSelectedEventId }, '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activePage, globalSelectedEventId]);

  const navigateTo = (page, eventId = null) => {
    setActivePage(page);
    if (eventId) setGlobalSelectedEventId(eventId);
    const query = eventId ? `?page=${page}&event=${eventId}` : `?page=${page}`;
    window.history.pushState({ page, eventId }, '', query);
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
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-300 font-sans overflow-hidden selection:bg-purple-500/30 relative">
      <ScrollbarStyles />
      
      <header className="h-8 bg-[#02040a] border-b border-indigo-900/30 flex items-center justify-between px-3 md:px-4 shrink-0 font-mono text-[9px] md:text-[10px] text-slate-500 tracking-widest uppercase relative z-10">
        <div className="flex items-center space-x-2 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="truncate">CLASSIFIED NETWORK MONITORING</span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-rose-500/80 border border-rose-900/30 bg-rose-950/20 px-2 py-0.5 rounded-sm">
          <span>[ RESTRICTED ] CONFIDENTIAL</span>
        </div>
        <div>
          <span className="text-slate-400 whitespace-pre">{formatDateTime(currentTime)}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/70 z-40 md:hidden"></div>
        )}

        <aside className={`absolute md:relative z-50 top-0 bottom-0 left-0 w-[280px] bg-[#060913] border-r border-indigo-900/30 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} relative overflow-hidden`}>
          <SidebarBackground />
          <div className="flex flex-col relative z-10">
            <div className="p-5 md:p-6 flex items-center justify-between border-b border-indigo-900/30 bg-[#04060d]/80 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 border border-indigo-500/30 bg-indigo-950/30 rounded">
                  <Shield className="text-purple-500 w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h1 className="text-sm md:text-base font-bold tracking-widest text-slate-100 uppercase">UniShield <span className="text-purple-500">AI</span></h1>
                  <span className="text-[9px] text-slate-500 tracking-widest font-mono uppercase block mt-0.5">PASSIVE THREAT DEFENSE</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <nav className="p-3 space-y-1 mt-2">
              <SidebarBtn icon={<Layout />} label="OVERVIEW" active={activePage === 'overview'} onClick={() => navigateTo('overview')} />
              <SidebarBtn icon={<Activity />} label="LIVE THREAT STREAM" badge={events.filter(e=>e.ai_assessment.severity === 'CRITICAL').length.toString()} pulse={pulse} active={activePage === 'stream'} onClick={() => navigateTo('stream')} />
              <SidebarBtn icon={<Crosshair />} label="THREAT ANALYTICS" active={activePage === 'analytics'} onClick={() => navigateTo('analytics')} />
              <SidebarBtn icon={<Terminal />} label="ZEEK CAPTURE LOGS" active={activePage === 'logs'} onClick={() => navigateTo('logs')} />
              <SidebarBtn icon={<Server />} label="SENSOR TELEMETRY" active={activePage === 'telemetry'} onClick={() => navigateTo('telemetry')} />
            </nav>
          </div>

          <div className="hidden lg:flex flex-1 flex-col items-center justify-center opacity-70 pointer-events-none px-4 min-h-[160px] relative z-10">
            <div className="text-center">
              <h3 className="text-[10px] font-mono font-bold text-slate-400/90 tracking-[0.15em] uppercase">National Cyber Defense</h3>
              <p className="text-[9px] font-mono text-slate-500/80 tracking-[0.25em] uppercase mt-1">Trust &bull; Monitor &bull; Protect</p>
            </div>
          </div>

          <div className="p-4 m-4 rounded border border-indigo-900/40 bg-[#0a0e1c]/80 backdrop-blur-md shrink-0 hidden md:block relative z-10">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-900/30 pb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Passive Ingest Mode</span>
                <span className="text-[9px] font-mono text-emerald-500 border border-emerald-900/50 bg-emerald-950/20 px-1.5 py-0.5 rounded">[ RX ONLY ]</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${connectionState === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  Kafka Ingest
                </span>
                <span className="text-purple-400">{connectionState === 'LIVE' ? '18.4K flow/s' : '0 flow/s'}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
          
          <BackgroundEffects />

          <header className="px-4 md:px-6 py-3 md:py-5 border-b border-indigo-900/30 flex items-center justify-between shrink-0 bg-[#060913]/90 relative z-10 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded border border-indigo-900/50 bg-[#0a0f1c] text-purple-400 hover:bg-indigo-900/30">
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
              <span>Last update: {pad(currentTime.getHours())}:{pad(currentTime.getMinutes())}:{pad(currentTime.getSeconds())}</span>
              {getStatusBadge()}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 relative z-10">
            {connectionState === 'DISCONNECTED' && (
              <div className="mb-4 bg-rose-950/30 border border-rose-900/50 p-4 rounded text-center font-mono">
                <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <h3 className="text-rose-400 font-bold uppercase tracking-widest text-xs">BACKEND DISCONNECTED</h3>
                <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest">WAITING FOR LIVE DATA...</p>
              </div>
            )}
            
            <div className={`flex flex-col space-y-4 md:space-y-5 min-h-full max-w-[1600px] mx-auto pb-6 transition-opacity duration-300 ${connectionState === 'DISCONNECTED' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {activePage === 'overview' && <ExecutiveView events={events} navigateTo={navigateTo} />}
              {activePage === 'stream' && <LiveStreamView events={events} navigateTo={navigateTo} globalSelectedEventId={globalSelectedEventId} setGlobalSelectedEventId={setGlobalSelectedEventId} />}
              {activePage === 'analytics' && <AnalyticsView events={events} globalSelectedEventId={globalSelectedEventId} navigateTo={navigateTo} />}
              {activePage === 'logs' && <ZeekLogsView events={events} navigateTo={navigateTo} globalSelectedEventId={globalSelectedEventId} setGlobalSelectedEventId={setGlobalSelectedEventId} />}
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
        <div className="bg-[#030712] border border-indigo-900/50 p-2 shadow-xl rounded-sm font-mono z-[1000] relative">
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

  // ==========================================================================
  // PERFECT 4x6 STAGGERED 24-HOUR HONEYCOMB (Exact interconnected math)
  // ==========================================================================
  const honeycombBuckets = useMemo(() => {
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

  const HoneycombTooltip = () => {
    if (!hoveredHex) return null;
    const bucket = honeycombBuckets.find(b => b.hourLabel === hoveredHex);
    if (!bucket) return null;
    
    const critCount = bucket.events.filter(e => e.ai_assessment.severity === 'CRITICAL').length;
    const highCount = bucket.events.filter(e => e.ai_assessment.severity === 'HIGH').length;
    const threatCount = bucket.events.filter(e => e.ai_assessment.verdict === 'THREAT').length;

    const types = bucket.events.reduce((acc, e) => { acc[e.ai_assessment.threat_type] = (acc[e.ai_assessment.threat_type] || 0) + 1; return acc; }, {});
    const topType = Object.entries(types).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A';
    const peakConf = bucket.events.length > 0 ? Math.max(...bucket.events.map(e => e.ai_assessment.confidence)) : 0;

    return (
      <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-full bg-[#030712] border border-indigo-900/50 p-3 shadow-2xl rounded-sm z-[100] font-mono w-56 pointer-events-none mb-4">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-2 flex justify-between">
          <span>PAST 24 HOURS</span>
          <span>{bucket.hourLabel}:00 – {pad((parseInt(bucket.hourLabel)+1)%24)}:00</span>
        </p>
        <p className="text-xl text-slate-200 font-light mb-2">{bucket.events.length} EVENTS</p>
        <div className="grid grid-cols-2 gap-1 text-[9px] mb-3 bg-[#060913] p-1.5 rounded border border-slate-800/50">
          <span className="text-rose-500 font-bold">{critCount} CRITICAL</span>
          <span className="text-orange-400 font-bold">{highCount} HIGH</span>
          <span className="text-purple-400 col-span-2 mt-1">{threatCount} TOTAL THREATS</span>
        </div>
        <div className="text-[9px]">
          <span className="block text-slate-500 uppercase tracking-widest">TOP DETECTION</span>
          <span className="block text-slate-300 truncate mb-2">{topType}</span>
          <span className="block text-slate-500 uppercase tracking-widest">PEAK AI CONFIDENCE</span>
          <span className="block text-purple-400 font-bold">{(peakConf * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  const getHoneycombColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-rose-600 text-white font-bold border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.6)] z-20';
      case 'HIGH': return 'bg-orange-500 text-white font-bold border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] z-10';
      case 'MEDIUM': return 'bg-amber-500 text-amber-950 font-bold border-amber-400 z-10';
      case 'LOW': return 'bg-purple-900/60 text-purple-300 border-purple-500/50 z-0';
      default: return 'bg-[#060913] text-slate-600 border-slate-800/60 z-0';
    }
  };

  const renderHexRow = (startIndex, endIndex, isOffset) => (
    <div className={`flex relative z-10 ${isOffset ? 'ml-[25px] -mt-[14px]' : '-mt-[14px]'}`} style={{ gap: '2px' }}>
      {honeycombBuckets.slice(startIndex, endIndex).map(b => (
        <div 
          key={b.hourLabel}
          onMouseEnter={() => setHoveredHex(b.hourLabel)}
          onMouseLeave={() => setHoveredHex(null)}
          onClick={() => navigateTo('stream')}
          className={`w-[48px] h-[56px] flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-50 border border-solid ${getHoneycombColor(b.maxSeverity)}`}
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        >
          <span className="text-[10px] font-mono opacity-90 pointer-events-none">{b.hourLabel}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KpiCard compact title="TOTAL ALERTS (24H)" value={totalAlerts} subtext="Metadata-only detections" icon={<Target />} trend="↑ LIVE" />
        <KpiCard compact title="CRITICAL BREACHES" value={criticalBreaches} subtext="High severity incidents" icon={<AlertTriangle />} trend="↑ LIVE" isCritical />
        <KpiCard compact title="AI CONFIDENCE AVG" value={avgConf} subtext="Across 6 ML classifiers" icon={<Cpu />} trend="↑ LIVE" isPurple />
        <KpiCard compact title="DETECTION LATENCY" value="142 ms" subtext="End-to-end pipeline" icon={<Activity />} trend="↓ -18%" isPurple />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        
        {/* PAST 24 HOURS HONEYCOMB PANEL */}
        <div className="flex-1 lg:flex-[0.68] bg-[#0a0f1c]/80 border border-indigo-900/30 flex flex-col relative overflow-visible group min-h-[340px] backdrop-blur-md shadow-xl rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 flex justify-between items-center bg-[#060913]/90 relative z-20">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">PAST 24 HOURS — THREAT ACTIVITY</h3>
            <span className="text-[9px] font-mono border border-emerald-900/50 text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded shadow-sm">[ ROLLING 24H ]</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 relative z-10 overflow-visible">
            {/* EXACT 24 CONNECTED HEXAGONS (4x6 Staggered Grid) */}
            <div className="relative flex flex-col items-center justify-center pt-[14px]">
              <HoneycombTooltip />
              <div className="flex flex-col scale-90 sm:scale-100 md:scale-110 transform origin-center transition-transform">
                
                {/* ROW 1: 00 to 05 */}
                <div className="flex relative z-10" style={{ gap: '2px' }}>
                  {honeycombBuckets.slice(0, 6).map(b => (
                    <div 
                      key={b.hourLabel}
                      onMouseEnter={() => setHoveredHex(b.hourLabel)}
                      onMouseLeave={() => setHoveredHex(null)}
                      onClick={() => navigateTo('stream')}
                      className={`w-[48px] h-[56px] flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-50 border border-solid ${getHoneycombColor(b.maxSeverity)}`}
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      <span className="text-[10px] font-mono font-bold opacity-90 pointer-events-none">{b.hourLabel}</span>
                    </div>
                  ))}
                </div>

                {/* ROW 2: 06 to 11 (Interlocking Offset) */}
                {renderHexRow(6, 12, true)}
                {/* ROW 3: 12 to 17 (Aligned with Row 1) */}
                {renderHexRow(12, 18, false)}
                {/* ROW 4: 18 to 23 (Aligned with Row 2) */}
                {renderHexRow(18, 24, true)}

              </div>
            </div>
          </div>
        </div>

        {/* THREAT CLASSES */}
        <div className="flex-1 lg:flex-[0.32] bg-[#0a0f1c]/80 border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[340px] backdrop-blur-md shadow-xl rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/90 relative z-20">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">THREAT CLASSES</h3>
          </div>
          <div className="flex-1 flex flex-col p-4 relative z-10">
            <div className="flex-1 relative min-h-[140px] z-10">
              {dynamicThreatDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dynamicThreatDistribution} innerRadius="68%" outerRadius="90%" paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                      {dynamicThreatDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip 
                      content={<CustomOverviewTooltip />} 
                      cursor={{fill: 'transparent'}}
                      wrapperStyle={{ zIndex: 1000, outline: 'none' }}
                      allowEscapeViewBox={{ x: false, y: false }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">Awaiting Data</div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl lg:text-3xl font-mono font-light text-slate-200">{activeThreatsCount}</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Active Threats</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-900/30 z-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2">
                {dynamicThreatDistribution.map((dist, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono pr-2">
                    <div className="flex items-center truncate">
                      <span className="w-1.5 h-1.5 mr-2 shrink-0" style={{ backgroundColor: dist.color }}></span>
                      <span className="text-slate-400 truncate w-[85px] xl:w-[95px]">{dist.name}</span>
                    </div>
                    <span className="text-slate-200 font-bold">{dist.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        
        {/* LIVE THREAT FEED (With Bounded Scroll) */}
        <div className="flex-1 lg:flex-[0.55] bg-[#0a0f1c]/80 border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[300px] backdrop-blur-md shadow-xl rounded-sm">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/90 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">LIVE THREAT FEED</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-[9px] text-slate-500 font-mono uppercase bg-[#04060d] sticky top-0 z-10 shadow-sm border-b border-indigo-900/30">
                <tr>
                  <th className="px-4 py-2.5 font-normal">SEVERITY</th>
                  <th className="px-4 py-2.5 font-normal">SOURCE IP</th>
                  <th className="px-4 py-2.5 font-normal">DETECTION</th>
                  <th className="px-4 py-2.5 font-normal">AI VERDICT</th>
                  <th className="px-4 py-2.5 font-normal text-right pr-6">CONF</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {events.slice(0, 50).map((evt) => (
                  <tr key={evt.id} onClick={() => navigateTo('analytics', evt.id)} className="border-b border-indigo-900/20 hover:bg-indigo-950/40 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <span className="flex items-center text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getSeverityBg(evt.ai_assessment.severity)}`}></span>
                        {evt.ai_assessment.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{evt.src_ip}</td>
                    <td className="px-4 py-3 text-purple-400">{evt.ai_assessment.threat_type}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${evt.ai_assessment.verdict === 'THREAT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                        {evt.ai_assessment.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-bold text-right pr-6">{(evt.ai_assessment.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP THREAT SOURCES (Redesigned) */}
        <div className="flex-1 lg:flex-[0.45] bg-[#0a0f1c]/80 border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[300px] backdrop-blur-md shadow-xl rounded-sm">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/90 shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">TOP THREAT SOURCES</h3>
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center space-y-4 font-mono overflow-y-auto custom-scrollbar">
            {topSources.length > 0 ? topSources.map((source, i) => {
              const percentage = (source.count / maxSourceCount) * 100;
              return (
                <div key={source.ip} className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center space-x-3">
                      <span className="text-[9px] bg-[#060913] border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">{pad(i+1)}</span>
                      <span className="text-slate-200">{source.ip}</span>
                    </div>
                    <span className="text-purple-400 font-bold pr-2">{source.count}</span>
                  </div>
                  <div className="w-full bg-[#030712] border border-slate-800/60 h-1.5 rounded-sm overflow-hidden flex">
                    <div 
                      className={`h-full rounded-sm transition-all duration-500 ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-orange-500' : 'bg-purple-600/80'}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest">No threat data available</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// LIVE THREAT STREAM
// ============================================================================
function LiveStreamView({ events, navigateTo, globalSelectedEventId, setGlobalSelectedEventId }) {
  
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
          { label: 'CRITICAL', value: events.filter(e=>e.ai_assessment.severity==='CRITICAL').length.toString(), color: 'text-rose-500' },
          { label: 'HIGH', value: events.filter(e=>e.ai_assessment.severity==='HIGH').length.toString(), color: 'text-orange-500' },
          { label: 'MEDIUM', value: events.filter(e=>e.ai_assessment.severity==='MEDIUM').length.toString(), color: 'text-yellow-400' },
          { label: 'EVENTS LOGGED', value: events.length.toString(), color: 'text-slate-200' },
          { label: 'AVG ML CONFIDENCE', value: events.length ? (events.reduce((a,e)=>a+e.ai_assessment.confidence,0)/events.length*100).toFixed(1)+'%' : 'N/A', color: 'text-purple-400' },
        ].map((card, i) => (
          <div key={i} className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 p-3 flex flex-col justify-between shadow-xl rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{card.label}</span>
            <span className={`text-xl font-mono font-light tracking-tight ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5 shrink-0 min-h-[400px]">
        {/* COMPACT BOUNDED AI PRIORITY QUEUE */}
        <div className="flex-1 lg:flex-[0.65] bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col relative overflow-hidden shadow-xl rounded-sm max-h-[450px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/90 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">AI PRIORITY QUEUE</h3>
            <span className="text-[9px] font-mono text-purple-400 hover:text-purple-300 cursor-pointer">View All →</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-2">
            {sortedEvents.length === 0 && <div className="text-[10px] text-slate-500 font-mono p-4 text-center">Waiting for live data...</div>}
            {sortedEvents.slice(0, 50).map((evt) => {
              const isSelected = evt.id === globalSelectedEventId;
              const isThreat = evt.ai_assessment.verdict === 'THREAT';
              const badgeColor = evt.ai_assessment.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                                 evt.ai_assessment.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                 evt.ai_assessment.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                                 'bg-slate-700/30 text-slate-400 border-slate-600/40';

              return (
                <div 
                  key={evt.id}
                  onClick={() => setGlobalSelectedEventId(evt.id)}
                  className={`flex flex-col p-2.5 font-mono text-[11px] border cursor-pointer transition-colors rounded-sm ${
                    isSelected ? 'bg-purple-900/20 border-purple-500/60 shadow-[0_0_10px_rgba(147,51,234,0.15)]' : 'bg-[#030712]/50 border-indigo-900/20 hover:border-indigo-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3 truncate pr-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${badgeColor}`}>[{evt.ai_assessment.severity}]</span>
                      <div className="truncate">
                        <div className="text-slate-200 font-bold truncate">{evt.ai_assessment.threat_type}</div>
                        <div className="text-[10px] text-slate-500 truncate">{evt.src_ip} → <span className="hidden sm:inline">{evt.dst_ip}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4 text-right shrink-0">
                      <div>
                        <div className={isThreat ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{(evt.ai_assessment.confidence * 100).toFixed(0)}% {evt.ai_assessment.verdict}</div>
                        <div className="text-[9px] text-slate-500 hidden sm:block">{evt.id}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 w-12 sm:w-16">{evt.timeLabel}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-900/20 text-[9px] text-slate-400 truncate">
                    <span className="font-bold text-slate-300">AI:</span> {evt.ai_assessment.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.35] bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col relative overflow-hidden shadow-xl rounded-sm max-h-[450px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/90 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">SELECTED EVENT</h3>
            <span className="text-[10px] font-mono text-purple-400 font-bold">{selectedEvent?.id}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col text-[10px]">
            {selectedEvent ? (
              <>
                <div>
                  <div className="text-sm md:text-base font-bold text-slate-100 uppercase tracking-wide mb-3">{selectedEvent.ai_assessment.threat_type}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2 text-slate-400 mb-4 pb-3 border-b border-indigo-900/30">
                    <div>SEVERITY: <span className={getSeverityColor(selectedEvent.ai_assessment.severity) + ' font-bold'}>{selectedEvent.ai_assessment.severity}</span></div>
                    <div>TIMESTAMP: <span className="text-slate-300">{selectedEvent.timeLabel}</span></div>
                    <div className="sm:col-span-2 truncate">SOURCE: <span className="text-slate-200">{selectedEvent.src_ip}</span></div>
                    <div className="sm:col-span-2 truncate">TARGET: <span className="text-slate-200">{selectedEvent.dst_ip}</span></div>
                    <div>VERDICT: <span className={selectedEvent.ai_assessment.verdict === 'THREAT' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{selectedEvent.ai_assessment.verdict}</span></div>
                    <div>CONFIDENCE: <span className="text-purple-400 font-bold">{(selectedEvent.ai_assessment.confidence * 100).toFixed(1)}%</span></div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase tracking-widest mb-2">DETECTION FEATURES</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                      {Object.entries(selectedEvent.ai_assessment.features_extracted || {}).map(([key, val]) => (
                        <div key={key} className="bg-[#030712] p-1.5 rounded border border-slate-800 flex justify-between">
                          <span className="text-slate-500 uppercase truncate pr-2">{key.replace(/_/g, ' ')}</span>
                          <span className={`font-bold ${val === 'HIGH' ? 'text-rose-400' : val === 'MED' ? 'text-amber-400' : 'text-slate-300'}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-indigo-900/30 flex flex-col space-y-2">
                  {selectedEvent.ai_assessment.response_status?.state === 'NEUTRALIZED' && (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-center py-2 rounded text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-center">
                       <CheckCircle className="w-3 h-3 mr-2" /> THREAT NEUTRALIZED
                    </div>
                  )}
                  {selectedEvent.ai_assessment.response_status?.state === 'FAILED' && (
                    <div className="bg-rose-900/20 border border-rose-500/30 text-rose-400 text-center py-2 rounded text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-center">
                       <XCircle className="w-3 h-3 mr-2" /> RESPONSE FAILED
                    </div>
                  )}
                  {selectedEvent.ai_assessment.response_status?.state === 'ACTION PENDING' && (
                    <div className="bg-amber-900/20 border border-amber-500/30 text-amber-400 text-center py-2 rounded text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-center">
                       <Clock className="w-3 h-3 mr-2 animate-pulse" /> RESPONSE IN PROGRESS
                    </div>
                  )}

                  <button 
                    onClick={() => navigateTo('analytics', selectedEvent.id)}
                    className="w-full bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 text-purple-300 text-[10px] font-mono tracking-widest uppercase py-2 rounded transition-all active:scale-[0.98] text-center shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    [ VIEW IN THREAT ANALYTICS ]
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[10px] font-mono text-slate-500">No event selected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// THREAT ANALYTICS
// ============================================================================
function AnalyticsView({ events, globalSelectedEventId, navigateTo }) {
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
        <div className="bg-[#0a0f1c] border border-purple-500/50 p-2 shadow-lg rounded-sm z-[100]">
          <p className="text-[10px] font-mono text-slate-200 font-bold mb-1 uppercase tracking-widest">{label}</p>
          <p className="text-[10px] font-mono text-purple-400 m-0">Latency: <span className="font-bold text-slate-100">{payload[0].value} ms</span></p>
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

  const correlatedEvents = analyzedEvent ? events.filter(e => e.src_ip === analyzedEvent.src_ip && e.id !== analyzedEvent.id).slice(0,3) : [];

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      
      {analyzedEvent && (
        <div ref={analyzeRef} className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-purple-500/50 p-4 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden rounded-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex justify-between items-center border-b border-purple-900/30 pb-3 mb-3 pl-3">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-purple-400 uppercase flex items-center">
              <ActivitySquare className="w-4 h-4 mr-2" />
              ANALYZING SELECTED EVENT: {analyzedEvent.id}
            </h3>
            <button onClick={() => navigateTo('stream')} className="text-[9px] font-mono text-slate-500 hover:text-slate-300 tracking-widest uppercase transition-colors">
              ← Back to Stream
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[10px] pl-3">
            <div><span className="text-slate-500 block mb-1">THREAT CLASS</span> <span className="text-slate-200 font-bold">{analyzedEvent.ai_assessment.threat_type}</span></div>
            <div><span className="text-slate-500 block mb-1">SEVERITY</span> <span className={`${getSeverityBg(analyzedEvent.ai_assessment.severity)} px-1.5 py-0.5 rounded text-white font-bold inline-block`}>{analyzedEvent.ai_assessment.severity}</span></div>
            <div><span className="text-slate-500 block mb-1">SOURCE</span> <span className="text-slate-200">{analyzedEvent.src_ip}</span></div>
            <div><span className="text-slate-500 block mb-1">ML CONFIDENCE</span> <span className="text-emerald-400 font-bold">{(analyzedEvent.ai_assessment.confidence * 100).toFixed(1)}%</span></div>
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
          <div key={i} className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 p-3 flex flex-col justify-between shadow-xl rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-light tracking-tight ${metric.isGreen ? 'text-emerald-400' : 'text-slate-200'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[260px]">
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 shadow-xl rounded-sm">
          <div className="flex flex-col border-b border-indigo-900/30 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">
              {analyzedEvent ? 'EVENT FEATURE EXPLANATION' : 'RELATIVE FEATURE IMPORTANCE'}
            </h3>
            <span className="text-[9px] font-mono text-purple-400/80 tracking-widest uppercase mt-0.5">
              NORMALIZED CONTRIBUTION
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-between space-y-2 lg:space-y-0">
            {displayFeatures.map((feat) => (
              <div key={feat.name} className="flex items-center">
                <span className="w-32 md:w-36 text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate">{feat.name}</span>
                <div className="flex-1 mx-3 bg-[#030712] h-1.5 border border-slate-800/80">
                  <div className="bg-purple-600/80 h-full transition-all duration-500" style={{ width: `${feat.value}%` }}></div>
                </div>
                <span className="w-8 text-right text-[10px] font-mono text-slate-300 font-bold">{feat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 shadow-xl rounded-sm">
          <div className="flex flex-col border-b border-indigo-900/30 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">MODEL INFERENCE LATENCY</h3>
            <span className="text-[9px] font-mono text-purple-400/80 tracking-widest uppercase mt-0.5">LOWER IS BETTER</span>
          </div>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inferenceLatency} margin={{ top: 25, right: 10, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} fill="#0f1423" />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#cbd5e1', fontWeight: 600}} interval={0} fontFamily="monospace" dy={10} />
                <YAxis ticks={[0, 25, 50, 75, 100]} domain={[0, 100]} stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `${val} ms`} fontFamily="monospace" width={45} />
                <RechartsTooltip content={<CustomLatencyTooltip />} cursor={false} />
                <ReferenceLine y={42} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.8}>
                  <Label value="AVG 42 ms" position="insideTopLeft" fill="#64748b" fontSize={9} fontFamily="monospace" offset={6} />
                </ReferenceLine>
                <Bar dataKey="ms" radius={[4, 4, 0, 0]} maxBarSize={38}>
                  {inferenceLatency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'LSTM' ? '#be123c' : '#7c3aed'} />
                  ))}
                  <LabelList dataKey="ms" position="top" fill="#f8fafc" fontSize={10} fontFamily="monospace" formatter={(val) => `${val} ms`} offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 flex-1 min-h-[160px] mt-4">
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 shadow-xl rounded-sm">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">
            {analyzedEvent ? 'CORRELATED ACTIVITY' : 'RECENT ACTIVITY'}
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-3">
            {analyzedEvent ? (
              correlatedEvents.length > 0 ? (
                correlatedEvents.map((impact, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800/50 pb-2 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-800/30 p-1" onClick={() => navigateTo('analytics', impact.id)}>
                    <span className="text-slate-300 uppercase tracking-widest w-32 truncate">{impact.ai_assessment.threat_type}</span>
                    <span className="text-slate-400">{impact.timeLabel}</span>
                    <span className={`font-bold ${getSeverityColor(impact.ai_assessment.severity)}`}>{impact.ai_assessment.severity}</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">No recent correlated activity from this IP</div>
              )
            ) : (
              <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">Select an event to view correlations</div>
            )}
          </div>
        </div>

        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 shadow-xl rounded-sm">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">
            {analyzedEvent ? 'MULTI-MODEL CONSENSUS' : 'MODEL HEALTH'}
          </h3>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono">
            {analyzedEvent ? (
              <>
                {Object.entries(analyzedEvent.ai_assessment.model_consensus).map(([modelKey, data]) => (
                  <div key={modelKey} className="flex items-center justify-between bg-[#060913]/50 px-2 py-1.5 border border-slate-800/80 rounded-sm">
                    <span className="text-slate-400 uppercase tracking-widest truncate mr-2">{modelKey.replace('_', ' ')}</span>
                    <span className={`flex items-center tracking-wider ${data.verdict === 'THREAT' ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                      {data.verdict} — {(data.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-purple-900/20 px-2 py-1.5 border border-purple-500/50 rounded-sm mt-1 sm:col-span-2">
                  <span className="text-purple-300 font-bold uppercase tracking-widest truncate mr-2">FINAL AI VERDICT</span>
                  <span className={`flex items-center font-bold tracking-widest ${analyzedEvent.ai_assessment.verdict === 'THREAT' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {analyzedEvent.ai_assessment.verdict}
                  </span>
                </div>
              </>
            ) : (
              <div className="col-span-2 text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">Models Online & Healthy</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZEEK LOGS VIEW (WITH FUNCTIONAL FILTERS & AI ASSESSMENT)
// ============================================================================
function ZeekLogsView({ events, navigateTo, globalSelectedEventId, setGlobalSelectedEventId }) {
  
  // Filter States
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterProtocol, setFilterProtocol] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [copyStatus, setCopyStatus] = useState('idle');

  // Filter Logic
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

  // Derived Options for Selects
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
          <div key={i} className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 p-3 flex flex-col justify-between shadow-xl rounded-sm">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
            <span className={`text-xl font-light tracking-tight ${stat.color || 'text-slate-200'}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 p-2 md:p-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between text-[10px] uppercase tracking-widest text-slate-400 gap-3 md:gap-0 shadow-xl rounded-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value)}
              className="bg-[#030712] border border-slate-800 text-slate-300 px-2 py-1 rounded cursor-pointer hover:border-slate-600 outline-none uppercase tracking-widest appearance-none"
            >
              <option value="ALL">LOG SOURCE: ALL ▼</option>
              {availableSources.map(src => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          
          <select 
            value={filterSeverity} 
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-[#030712] border border-slate-800 text-slate-300 px-2 py-1 rounded cursor-pointer hover:border-slate-600 outline-none uppercase tracking-widest appearance-none"
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
            className="bg-[#030712] border border-slate-800 text-slate-300 px-2 py-1 rounded cursor-pointer hover:border-slate-600 outline-none uppercase tracking-widest appearance-none"
          >
            <option value="ALL">PROTOCOL: ALL ▼</option>
            {availableProtocols.map(proto => <option key={proto} value={proto}>{proto}</option>)}
          </select>
          
          <div className="flex items-center bg-[#030712] border border-slate-800 rounded px-2 py-1 min-w-[200px]">
            <Search className="w-3 h-3 mr-2 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search IP, UID, Threat..." 
              className="bg-transparent border-none outline-none text-slate-300 placeholder-slate-600 w-full font-sans text-xs" 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {(filterSource !== 'ALL' || filterSeverity !== 'ALL' || filterProtocol !== 'ALL' || searchQuery) && (
            <button 
              onClick={() => { setFilterSource('ALL'); setFilterSeverity('ALL'); setFilterProtocol('ALL'); setSearchQuery(''); }}
              className="text-rose-400 hover:text-rose-300 tracking-widest"
            >
              [ RESET ]
            </button>
          )}
          <span className="text-slate-300 bg-[#030712] border border-slate-800 px-2 py-1 rounded cursor-pointer hover:border-slate-600">Last 15 min ▼</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 shrink-0 min-h-[450px]">
        {/* COMPACT BOUNDED ZEEK EVENT STREAM */}
        <div className="flex-1 lg:flex-[0.60] bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col relative overflow-hidden shadow-xl rounded-sm max-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-indigo-900/30 bg-[#060913]/90 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">LIVE ZEEK EVENT STREAM</h3>
            <span className="text-[9px] text-slate-500">{filteredEvents.length} MATCHING EVENTS</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#02040a]/80 p-3 space-y-2.5 text-[11px] leading-relaxed relative z-10">
            {filteredEvents.length > 0 ? filteredEvents.slice(0, 100).map((evt) => (
              <div 
                key={evt.id}
                onClick={() => setGlobalSelectedEventId(evt.id)}
                className={`p-2.5 border-l-2 cursor-pointer transition-colors ${
                  globalSelectedEventId === evt.id ? 'bg-purple-900/10 border-purple-500' : 'border-transparent hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-slate-500">{evt.timeLabel}</span>
                  <span className={`font-bold ${getSeverityColor(evt.ai_assessment.severity)}`}>[{evt.log_source}]</span>
                </div>
                <div className="text-slate-300 mb-1">
                  <span className="text-purple-400/80 mr-3">{evt.id}</span>
                  {evt.src_ip} {evt.dst_ip && <span className="text-slate-500">→ {evt.dst_ip}:{evt.ports}</span>}
                </div>
                <div className="text-slate-400 whitespace-pre-wrap">
                  {evt.ai_assessment.threat_type} ({evt.raw_event?.proto})
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full text-slate-500 tracking-widest uppercase text-[10px]">No events match filters</div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Event Inspector & AI Assessment */}
        <div className="flex-1 lg:flex-[0.40] bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col relative overflow-hidden shadow-xl rounded-sm max-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-indigo-900/30 bg-[#060913]/90 shrink-0">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">EVENT INSPECTOR</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col text-[10px] relative z-10">
            {selectedEvent ? (
              <>
                {/* Event Metadata */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                  <div><span className="text-slate-500 block mb-0.5">EVENT TYPE</span> <span className="text-slate-300">{selectedEvent.ai_assessment.threat_type}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">LOG SOURCE</span> <span className="text-slate-300">{selectedEvent.log_source}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">TIMESTAMP</span> <span className="text-slate-300">{selectedEvent.timeLabel}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">CONNECTION UID</span> <span className="text-purple-400">{selectedEvent.id}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">SOURCE IP</span> <span className="text-slate-300">{selectedEvent.src_ip}</span></div>
                  <div><span className="text-slate-500 block mb-0.5">DESTINATION</span> <span className="text-slate-300">{selectedEvent.dst_ip}:{selectedEvent.ports}</span></div>
                </div>

                {/* Event Action Utilities */}
                <div className="flex space-x-2 mb-4 pb-4 border-b border-indigo-900/30 shrink-0">
                  <button 
                    onClick={handleCopyEvent}
                    disabled={!selectedEvent.raw_event}
                    className="flex-1 flex items-center justify-center bg-[#060913] border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 py-2 rounded transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copyStatus === 'success' ? 'COPIED ✓' : copyStatus === 'error' ? 'COPY FAILED' : <><Copy className="w-3 h-3 mr-2" /> COPY EVENT</>}
                  </button>
                  <button 
                    onClick={() => navigateTo('stream', selectedEvent.id)}
                    className="flex-1 flex items-center justify-center bg-purple-900/30 border border-purple-500/50 hover:bg-purple-900/50 text-purple-300 py-2 rounded transition-colors uppercase tracking-widest"
                  >
                    <ActivitySquare className="w-3 h-3 mr-2" /> THREAT STREAM
                  </button>
                </div>

                {/* AUTOMATED AI THREAT ASSESSMENT PANEL */}
                <div className="flex flex-col space-y-3 shrink-0">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center">
                    <Cpu className="w-3 h-3 mr-1.5" /> AI THREAT ASSESSMENT
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9px] bg-[#030712] p-2 border border-indigo-900/30 rounded">
                      <div><span className="text-slate-500 block mb-0.5">VERDICT</span> <span className={`font-bold ${selectedEvent.ai_assessment.verdict === 'THREAT' ? 'text-rose-500' : 'text-emerald-500'}`}>{selectedEvent.ai_assessment.verdict === 'FALSE POSITIVE' ? '✓ FALSE POSITIVE' : '⚠ THREAT'}</span></div>
                      <div><span className="text-slate-500 block mb-0.5">CONFIDENCE</span> <span className="text-slate-200 font-bold">{(selectedEvent.ai_assessment.confidence * 100).toFixed(1)}%</span></div>
                      <div><span className="text-slate-500 block mb-0.5">THREAT TYPE</span> <span className="text-slate-200">{selectedEvent.ai_assessment.threat_type}</span></div>
                      <div><span className="text-slate-500 block mb-0.5">SEVERITY</span> <span className={getSeverityColor(selectedEvent.ai_assessment.severity) + ' font-bold'}>{selectedEvent.ai_assessment.severity}</span></div>
                  </div>

                  <div className="bg-[#030712] p-2 border border-indigo-900/30 rounded text-[9px]">
                      <span className="text-slate-500 block mb-1 uppercase tracking-widest">Why was this flagged?</span>
                      <p className="text-slate-300 leading-relaxed mb-2">{selectedEvent.ai_assessment.explanation}</p>
                      <span className="text-slate-500 block mb-1 uppercase tracking-widest">Evidence</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5 ml-1">
                        {selectedEvent.ai_assessment.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                      </ul>
                  </div>

                  {Object.keys(selectedEvent.ai_assessment.model_consensus).length > 0 && (
                    <div className="bg-[#030712] p-2 border border-indigo-900/30 rounded text-[9px]">
                        <span className="text-slate-500 block mb-1 uppercase tracking-widest">Model Consensus</span>
                        <div className="space-y-1 mb-2">
                          {Object.entries(selectedEvent.ai_assessment.model_consensus).map(([modelKey, data]) => (
                            <div key={modelKey} className="flex justify-between items-center">
                              <span className="text-slate-400 capitalize">{modelKey.replace('_', ' ')}</span>
                              <span className="text-slate-300">
                                <span className={data.verdict === 'THREAT' ? 'text-rose-400' : 'text-emerald-400'}>{data.verdict}</span>
                                <span className="ml-2 opacity-70">{(data.confidence * 100).toFixed(0)}%</span>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-indigo-900/30 pt-2 flex flex-col justify-center">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-purple-400 uppercase">Final AI Decision</span>
                            <span className={selectedEvent.ai_assessment.verdict === 'THREAT' ? 'text-rose-500' : 'text-emerald-500'}>{selectedEvent.ai_assessment.verdict} — {(selectedEvent.ai_assessment.confidence * 100).toFixed(1)}%</span>
                          </div>
                          {selectedEvent.ai_assessment.response_status?.state === 'NEUTRALIZED' && (
                            <div className="text-emerald-400 font-bold mt-2 pt-2 border-t border-indigo-900/20 text-center tracking-widest uppercase flex items-center justify-center">
                               <CheckCircle className="w-3 h-3 mr-1.5" /> THREAT NEUTRALIZED
                            </div>
                          )}
                          {selectedEvent.ai_assessment.response_status?.state === 'FAILED' && (
                            <div className="text-rose-400 font-bold mt-2 pt-2 border-t border-indigo-900/20 text-center tracking-widest uppercase flex items-center justify-center">
                               <XCircle className="w-3 h-3 mr-1.5" /> RESPONSE FAILED
                            </div>
                          )}
                        </div>
                    </div>
                  )}

                  {/* AI Response Status - Full Pipeline View */}
                  {selectedEvent.ai_assessment.response_status && (
                    <div className="bg-purple-900/10 p-2 border border-purple-500/30 rounded text-[9px]">
                        <span className="text-purple-400 block mb-2 uppercase tracking-widest font-bold">AI RESPONSE STATUS</span>
                        
                        <div className="flex items-center space-x-2 text-slate-300 mb-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> <span>THREAT DETECTED</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-300 mb-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> <span>ANALYZING</span>
                        </div>
                        
                        {selectedEvent.ai_assessment.response_status.state === 'NEUTRALIZED' ? (
                          <>
                            <div className="flex items-center space-x-2 text-slate-300 mb-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> <span>RESPONSE INITIATED</span>
                            </div>
                            <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-3">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> <span>THREAT NEUTRALIZED</span>
                            </div>
                          </>
                        ) : selectedEvent.ai_assessment.response_status.state === 'FAILED' ? (
                          <>
                            <div className="flex items-center space-x-2 text-slate-300 mb-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> <span>RESPONSE INITIATED</span>
                            </div>
                            <div className="flex items-center space-x-2 text-rose-400 font-bold mb-3">
                              <XCircle className="w-3 h-3 text-rose-500" /> <span>RESPONSE FAILED</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center space-x-2 text-amber-400 font-bold mb-3 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-500" /> <span>ACTION PENDING</span>
                          </div>
                        )}

                        <span className="text-slate-500 block mb-0.5 uppercase tracking-widest">{selectedEvent.ai_assessment.response_status.state === 'NEUTRALIZED' ? 'Response Action' : 'Recommended Action'}</span>
                        <p className="text-slate-300 mb-2">{selectedEvent.ai_assessment.response_status.action}</p>
                        
                        {selectedEvent.ai_assessment.response_status.response_time && (
                          <>
                            <span className="text-slate-500 block mb-0.5 uppercase tracking-widest">Response Time</span>
                            <p className="text-slate-300">{selectedEvent.ai_assessment.response_status.response_time}</p>
                          </>
                        )}
                    </div>
                  )}

                  {/* Navigation utility */}
                  <button 
                    onClick={() => navigateTo('analytics', selectedEvent.id)}
                    className="w-full mt-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 text-purple-300 text-[10px] font-mono tracking-widest uppercase py-2 rounded transition-all active:scale-[0.98] text-center shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] shrink-0"
                  >
                    [ VIEW IN THREAT ANALYTICS ]
                  </button>

                  <div className="mt-4 pt-2 border-t border-indigo-900/30 shrink-0">
                    <span className="text-slate-500 block mb-2 uppercase tracking-widest">RAW EVENT</span>
                    <pre className="bg-[#02040a] border border-slate-800 p-3 rounded text-[10px] text-indigo-300/80 overflow-x-auto whitespace-pre-wrap word-break-all">
                      {JSON.stringify(selectedEvent.raw_event, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">Waiting for live data...</div>
            )}
            
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
          <div key={i} className="bg-[#0a0f1c]/90 backdrop-blur-sm border border-indigo-900/30 p-3 flex flex-col justify-between shadow-xl rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-light tracking-tight ${metric.isGreen ? 'text-emerald-400' : 'text-slate-200'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[220px]">
        <div className="bg-[#0a0f1c]/90 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden shadow-xl rounded-sm">
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

        <div className="bg-[#0a0f1c]/90 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden shadow-xl rounded-sm">
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

      <div className="bg-[#0a0f1c]/90 backdrop-blur-sm border border-indigo-900/30 p-4 shrink-0 flex flex-col relative overflow-hidden hidden sm:flex shadow-xl rounded-sm">
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
        <div className="bg-[#0a0f1c]/90 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden shadow-xl rounded-sm">
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

        <div className="bg-[#0a0f1c]/90 backdrop-blur-sm border border-indigo-900/30 flex flex-col p-4 relative overflow-hidden shadow-xl rounded-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-3">SYSTEM EVENTS</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1 max-h-[150px] lg:max-h-full">
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
        : 'text-slate-500 hover:bg-[#0a0e1c]/50 hover:text-slate-300 border-l-2 border-transparent'
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

function KpiCard({ title, value, subtext, icon, trend, isCritical, isPurple, compact }) {
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
    <div className={`bg-[#0a0f1c]/80 backdrop-blur-sm border border-indigo-900/30 flex flex-col relative overflow-hidden group min-h-[110px] shadow-xl rounded-sm ${compact ? 'p-3' : 'p-3 md:p-4'}`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className={`flex justify-between items-start ${compact ? 'mb-1' : 'mb-2 md:mb-3'}`}>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono truncate mr-2">{title}</span>
        <div className={`${iconColor} shrink-0`}>{icon}</div>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col">
          <div className={`text-2xl lg:text-3xl font-light font-mono tracking-tight leading-none mb-1 ${valueColor}`}>{value}</div>
          <div className="text-[9px] md:text-[10px] text-slate-500 font-mono truncate max-w-[120px] sm:max-w-[160px]">{subtext}</div>
        </div>
        {trend && (
          <div className={`text-[9px] md:text-[10px] font-mono shrink-0 ${trendColor}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}