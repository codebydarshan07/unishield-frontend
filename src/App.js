import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList, ReferenceLine, Label
} from 'recharts';
import { 
  Shield, Activity, AlertTriangle, Crosshair, 
  Database, Layout, Terminal, Server, Cpu, 
  Target, Radio, CheckCircle2, ShieldAlert,
  Search, ArrowRight, Menu, X, Filter, Copy, ActivitySquare
} from 'lucide-react';

// ============================================================================
// GLOBAL MOCK DATA & SHARED STATE
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

const sharedLiveDetections = [
  { id: 'EVT-9021', severity: 'CRITICAL', title: 'DGA / DNS Anomaly', src: '10.24.18.42', dst: '10.24.1.10', engine: 'Random Forest', conf: '98.2%', time: '16:52:31', features: { entropy: "HIGH", arrival: "HIGH", fanOut: "MED", dnsAnomaly: "HIGH" } },
  { id: 'EVT-9022', severity: 'HIGH', title: 'Port Scan', src: '10.24.21.17', dst: '10.24.1.0/24', engine: 'Heuristic + RF', conf: '92.1%', time: '16:51:48', features: { entropy: "LOW", arrival: "HIGH", fanOut: "HIGH", portScan: "HIGH" } },
  { id: 'EVT-9023', severity: 'HIGH', title: 'Beaconing', src: '10.24.19.08', dst: '198.51.100.4', engine: 'XGBoost FFT', conf: '88.3%', time: '16:50:22', features: { entropy: "MED", arrival: "MED", fanOut: "LOW", periodicity: "HIGH" } },
  { id: 'EVT-9024', severity: 'MEDIUM', title: 'Anomalous Flow', src: '10.24.14.63', dst: '10.24.0.53', engine: 'Isolation Forest', conf: '81.4%', time: '16:49:57', features: { entropy: "HIGH", arrival: "LOW", fanOut: "MED", sizeVariance: "HIGH" } },
  { id: 'EVT-9025', severity: 'MEDIUM', title: 'DNS Anomaly', src: '10.24.22.91', dst: '10.24.0.53', engine: 'CNN/LSTM', conf: '79.9%', time: '16:48:36', features: { entropy: "HIGH", arrival: "MED", fanOut: "LOW", dnsAnomaly: "HIGH" } },
  { id: 'EVT-9026', severity: 'LOW', title: 'Encrypted Payload', src: '10.24.8.19', dst: 'External', engine: 'Autoencoder', conf: '65.2%', time: '16:45:11', features: { entropy: "HIGH", arrival: "LOW", fanOut: "LOW", certMismatch: "LOW" } },
  { id: 'EVT-9027', severity: 'LOW', title: 'Mismatched Cert', src: '10.24.5.11', dst: 'External', engine: 'JA3 Fingerprint', conf: '61.8%', time: '16:42:05', features: { entropy: "LOW", arrival: "LOW", fanOut: "LOW", certMismatch: "HIGH" } },
];

const zeekEventsData = [
  { id: 'CjH2u123', ts: '16:55:04.12', log: 'conn.log', uid: 'CjH2u123', src: '10.24.5.18:54210', dst: '10.24.1.10:80', summary: 'TCP   14280 bytes   duration 0.82s', color: 'text-slate-300', severity: 'INFO', title: 'CONNECTION', ports: '80', features: { bytes: 'MED', duration: 'LOW' }, raw: { "ts": 165504.12, "uid": "CjH2u123", "id.orig_h": "10.24.5.18", "id.orig_p": 54210, "id.resp_h": "10.24.1.10", "id.resp_p": 80, "proto": "tcp", "duration": 0.82, "orig_bytes": 1024, "resp_bytes": 14280 } },
  { id: 'Cd87a32', ts: '16:55:03.87', log: 'dns.log', uid: 'Cd87a32', src: '10.24.7.41', dst: '10.24.0.53', summary: 'query: 3fa7b12.tunnel.c2node.io\ntype: TXT   status: NOERROR', color: 'text-slate-300', severity: 'INFO', title: 'DNS QUERY', ports: '53', features: { entropy: 'MED', dnsType: 'TXT' }, raw: { "ts": 165503.87, "uid": "Cd87a32", "id.orig_h": "10.24.7.41", "id.resp_h": "10.24.0.53", "query": "3fa7b12.tunnel.c2node.io", "qtype_name": "TXT", "rcode_name": "NOERROR" } },
  { id: 'Cs34f99', ts: '16:55:02.41', log: 'ssl.log', uid: 'Cs34f99', src: '10.24.8.19:443', dst: '—', summary: 'TLSv1.2   TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', color: 'text-slate-300', severity: 'INFO', title: 'SSL HANDSHAKE', ports: '443', features: { version: 'TLSv1.2' }, raw: { "ts": 165502.41, "uid": "Cs34f99", "id.orig_h": "10.24.8.19", "id.resp_p": 443, "version": "TLSv1.2", "cipher": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256" } },
  { id: 'Cw91x00', ts: '16:55:01.22', log: 'weird.log', uid: 'Cw91x00', src: '10.24.3.22', dst: '—', summary: 'active_connection_reuse', color: 'text-rose-500', severity: 'SUSPICIOUS', title: 'WEIRD ACTIVITY', ports: '—', features: { weirdName: 'HIGH' }, raw: { "ts": 165501.22, "uid": "Cw91x00", "id.orig_h": "10.24.3.22", "name": "active_connection_reuse", "notice": false, "peer": "zeek-sensor-02" } },
  { id: 'Cn2b211', ts: '16:55:00.94', log: 'notice.log', uid: 'Cn2b211', src: '10.24.3.22', dst: '—', summary: 'Scan::Address_Scan\n65 ports scanned', color: 'text-amber-500', severity: 'HIGH', title: 'NOTICE', ports: '65', features: { fanOut: 'HIGH', scanActivity: 'HIGH' }, raw: { "ts": 165500.94, "uid": "Cn2b211", "src": "10.24.3.22", "notice": "Scan::Address_Scan", "msg": "65 ports scanned", "sub": "remote", "actions": ["Notice::ACTION_LOG"] } },
  { id: 'Ch9k312', ts: '16:54:59.72', log: 'conn.log', uid: 'Ch9k312', src: '10.24.18.42:53', dst: '10.24.0.53:53', summary: 'UDP   512 bytes', color: 'text-slate-300', severity: 'INFO', title: 'CONNECTION', ports: '53', features: { bytes: 'LOW' }, raw: { "ts": 165459.72, "uid": "Ch9k312", "id.orig_h": "10.24.18.42", "id.orig_p": 53, "id.resp_h": "10.24.0.53", "id.resp_p": 53, "proto": "udp", "orig_bytes": 256, "resp_bytes": 256 } },
];

const globalEventStore = [...sharedLiveDetections, ...zeekEventsData];

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
    case 'SUSPICIOUS': return 'bg-rose-500';
    case 'HIGH': return 'bg-orange-500';
    case 'MEDIUM': return 'bg-yellow-500';
    case 'LOW': return 'bg-slate-500';
    case 'INFO': return 'bg-slate-400';
    default: return 'bg-slate-500';
  }
};

const formatDateTime = (date) => {
  const pad = (num) => num.toString().padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = pad(date.getDate());
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${d} ${m} ${y}    ${hh}:${mm}:${ss}`;
};

// ============================================================================
// DEMO AI PIPELINE & BACKEND ADAPTER
// ============================================================================

// 1. Used for the Threat Analytics Page (Deterministic)
function simulateAIAnalysis(event, allEvents) {
  if (!event) return null;
  const seed = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isMalicious = ['CRITICAL', 'HIGH', 'SUSPICIOUS'].includes(event.severity);
  const features = Object.entries(event.features || { entropy: 'HIGH', payload: 'MED' }).map(([k, v]) => ({
      name: k.replace(/([A-Z])/g, ' $1').trim(),
      value: v === 'HIGH' ? (30 + (seed % 10)) : v === 'MED' ? (15 + (seed % 5)) : (5 + (seed % 3))
  }));
  const srcIp = event.src ? event.src.split(':')[0] : '10.24.18.42';
  const correlated = allEvents.filter(e => {
     const eSrc = e.src ? e.src.split(':')[0] : '';
     return eSrc === srcIp && e.id !== event.id;
  }).slice(0, 3);

  return {
     verdict: isMalicious ? 'MALICIOUS' : 'ANOMALOUS',
     confidence: event.conf || `${(85 + (seed % 14)).toFixed(1)}%`,
     models: [
       { name: 'Isolation Forest', decision: 'ANOMALOUS', conf: (85 + (seed % 10)).toFixed(1) + '%' },
       { name: 'Random Forest', decision: isMalicious ? 'MALICIOUS' : 'ANOMALOUS', conf: (90 + (seed % 8)).toFixed(1) + '%' },
       { name: 'XGBoost', decision: isMalicious ? 'MALICIOUS' : 'ANOMALOUS', conf: (88 + (seed % 9)).toFixed(1) + '%' },
       { name: 'Autoencoder', decision: 'ANOMALOUS', conf: (80 + (seed % 15)).toFixed(1) + '%' },
       { name: 'LSTM / DGA', decision: isMalicious ? 'MALICIOUS' : 'BENIGN', conf: (92 + (seed % 7)).toFixed(1) + '%' },
     ],
     features: features.sort((a, b) => b.value - a.value),
     correlated: correlated
  };
}

// 2. Used for the live Zeek Logs AI Threat Assessment Panel (Simulates Backend Contract)
function fetchAIAssessment(event) {
  return new Promise((resolve) => {
    // Simulate network delay for realistic "Analyzing event..." loading state
    setTimeout(() => {
      const seed = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const isMalicious = ['CRITICAL', 'HIGH', 'SUSPICIOUS'].includes(event.severity);
      
      let explanation = "";
      let evidence = [];
      
      if (isMalicious) {
        if (event.title?.includes('Scan') || event.title?.includes('NOTICE')) {
          explanation = "AI detected scanning behavior because the source host contacted an unusually large number of destination ports within a short interval. The observed port fan-out and connection frequency differ from the expected baseline.";
          evidence = ["65 ports scanned in a short interval", "High port fan-out ratio", "Abnormal connection frequency", "Behavior differs from historical baseline"];
        } else if (event.title?.includes('DNS')) {
          explanation = "AI detected an anomalous DNS payload. The query structure and entropy resemble Domain Generation Algorithm (DGA) behavior often used for C2 beaconing.";
          evidence = ["High DNS query entropy", "Unusual sub-domain length", "Missing typical DNS resolution patterns"];
        } else {
          explanation = "AI flagged this event due to significant deviations in payload size and connection timing compared to the host's historical baseline.";
          evidence = ["Abnormal connection duration", "High payload size variance", "Unexpected protocol usage for port"];
        }
      } else {
        explanation = "The observed traffic initially matched a suspicious pattern, but the AI determined that it is consistent with expected internal service behavior.";
        evidence = ["Known internal destination", "Normal connection frequency", "Expected protocol behavior", "Matches baseline traffic"];
      }

      resolve({
         event_id: event.id,
         threat_type: event.title || 'Anomaly',
         severity: event.severity,
         verdict: isMalicious ? 'THREAT' : 'FALSE POSITIVE',
         confidence: event.conf ? parseFloat(event.conf) / 100 || 0.94 : (0.85 + (seed % 14) / 100),
         explanation: explanation,
         evidence: evidence,
         model_consensus: {
           isolation_forest: { verdict: 'THREAT', confidence: (0.85 + (seed % 10) / 100) },
           random_forest: { verdict: isMalicious ? 'THREAT' : 'FALSE POSITIVE', confidence: (0.90 + (seed % 8) / 100) },
           xgboost: { verdict: isMalicious ? 'THREAT' : 'FALSE POSITIVE', confidence: (0.88 + (seed % 9) / 100) },
           autoencoder: { verdict: 'FALSE POSITIVE', confidence: (0.80 + (seed % 15) / 100) }
         },
         recommended_action: isMalicious ? `Investigate source host ${event.src?.split(':')[0]} and correlate recent connection events.` : `No immediate action required. Expected baseline behavior.`
      });
    }, 600);
  });
}


// ============================================================================
// MAIN APPLICATION SHELL & ROUTING ENGINE
// ============================================================================
export default function UniShieldDashboard() {
  const [pulse, setPulse] = useState(false);
  const [activePage, setActivePage] = useState('logs'); 
  const [globalSelectedEventId, setGlobalSelectedEventId] = useState('Cn2b211');
  const [analystFeedback, setAnalystFeedback] = useState({}); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
        setActivePage(e.state.page || 'logs');
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

  const handleFeedback = (eventId, label) => {
    setAnalystFeedback(prev => ({
      ...prev,
      [eventId]: { label, timestamp: new Date().toISOString(), source: 'analyst' }
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-300 font-sans overflow-hidden selection:bg-purple-500/30">
      
      <header className="h-8 bg-[#02040a] border-b border-indigo-900/30 flex items-center justify-between px-3 md:px-4 shrink-0 font-mono text-[9px] md:text-[10px] text-slate-500 tracking-widest uppercase">
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

      <div className="flex flex-1 overflow-hidden relative">
        
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
          ></div>
        )}

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
              <SidebarBtn icon={<Layout />} label="OVERVIEW" active={activePage === 'overview'} onClick={() => navigateTo('overview')} />
              <SidebarBtn icon={<Activity />} label="LIVE THREAT STREAM" badge="6" pulse={pulse} active={activePage === 'stream'} onClick={() => navigateTo('stream')} />
              <SidebarBtn icon={<Crosshair />} label="THREAT ANALYTICS" active={activePage === 'analytics'} onClick={() => navigateTo('analytics')} />
              <SidebarBtn icon={<Terminal />} label="ZEEK CAPTURE LOGS" active={activePage === 'logs'} onClick={() => navigateTo('logs')} />
              <SidebarBtn icon={<Server />} label="SENSOR TELEMETRY" active={activePage === 'telemetry'} onClick={() => navigateTo('telemetry')} />
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
                  <span>Last update: {pad(currentTime.getHours())}:{pad(currentTime.getMinutes())}:{pad(currentTime.getSeconds())}</span>
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
            <div className="flex flex-col space-y-4 md:space-y-5 min-h-full max-w-[1600px] mx-auto pb-6">
              {activePage === 'overview' && <ExecutiveView />}
              {activePage === 'stream' && <LiveStreamView navigateTo={navigateTo} globalSelectedEventId={globalSelectedEventId} setGlobalSelectedEventId={setGlobalSelectedEventId} handleFeedback={handleFeedback} analystFeedback={analystFeedback} />}
              {activePage === 'analytics' && <AnalyticsView globalSelectedEventId={globalSelectedEventId} navigateTo={navigateTo} />}
              {activePage === 'logs' && <ZeekLogsView navigateTo={navigateTo} globalSelectedEventId={globalSelectedEventId} setGlobalSelectedEventId={setGlobalSelectedEventId} handleFeedback={handleFeedback} analystFeedback={analystFeedback} />}
              {activePage === 'telemetry' && <TelemetryView />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

// ============================================================================
// FULL VIEWS 
// ============================================================================

function ExecutiveView() {
  const pipelineStages = [
    { label: 'Zeek Sensor', status: 'ONLINE', icon: <Terminal className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'Kafka Ingest', status: 'ACTIVE', icon: <Database className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'Feature Extr.', status: 'ONLINE', icon: <Cpu className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'ML Inference', status: 'ONLINE', icon: <Activity className="w-3.5 h-3.5 text-purple-400"/> },
    { label: 'Alert Engine', status: 'ONLINE', icon: <Radio className="w-3.5 h-3.5 text-purple-400"/> },
  ];

  const CustomOverviewTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#030712] border border-indigo-900/50 p-2 shadow-xl rounded-sm z-[100]">
          <p className="text-[10px] font-mono text-slate-200 m-0 flex items-center">
            <span style={{ backgroundColor: payload[0].payload.color }} className="w-2 h-2 mr-2 inline-block rounded-sm"></span>
            <span>{payload[0].name}</span>
            <span className="text-slate-400 ml-3 font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KpiCard compact title="TOTAL ALERTS (24H)" value="1,248" subtext="Metadata-only detections" icon={<Target />} trend="↑ +12%" />
        <KpiCard compact title="CRITICAL BREACHES" value="4" subtext="High severity incidents" icon={<AlertTriangle />} trend="↑ +33%" isCritical />
        <KpiCard compact title="AI CONFIDENCE AVG" value="94.7%" subtext="Across 6 ML classifiers" icon={<Cpu />} trend="↑ +1.2%" isPurple />
        <KpiCard compact title="DETECTION LATENCY" value="142 ms" subtext="End-to-end pipeline" icon={<Activity />} trend="↓ -18%" isPurple />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        <div className="flex-1 lg:flex-[0.68] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden group min-h-[340px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 flex justify-between items-center bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">THREAT ACTIVITY — LAST 60 MIN</h3>
            <span className="text-[9px] font-mono border border-emerald-900/50 text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded">[ LIVE ]</span>
          </div>
          <div className="flex-1 p-2 md:p-4 relative">
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

        <div className="flex-1 lg:flex-[0.32] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[340px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">THREAT CLASSES</h3>
          </div>
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 relative min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={threatDistribution} innerRadius="68%" outerRadius="90%" paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                    {threatDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip content={<CustomOverviewTooltip />} cursor={{fill: 'transparent'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl lg:text-3xl font-mono font-light text-slate-200">27</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Active Threats</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-900/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-2">
                {threatDistribution.map((dist, i) => (
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
        <div className="flex-1 lg:flex-[0.48] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 flex justify-between items-center shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">LIVE THREAT FEED</h3>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-[9px] text-slate-500 font-mono uppercase bg-[#04060d] sticky top-0 z-10 shadow-sm border-b border-indigo-900/30">
                <tr>
                  <th className="px-4 py-2.5 font-normal">SEVERITY</th>
                  <th className="px-4 py-2.5 font-normal">SOURCE IP</th>
                  <th className="px-4 py-2.5 font-normal">DETECTION</th>
                  <th className="px-4 py-2.5 font-normal text-right">TIME</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {overviewAlerts.map((alert, i) => (
                  <tr key={i} className="border-b border-indigo-900/20 hover:bg-indigo-950/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="flex items-center text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getSeverityColor(alert.severity)}`}></span>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{alert.source}</td>
                    <td className="px-4 py-3 text-purple-400">{alert.detection}</td>
                    <td className="px-4 py-3 text-slate-500 text-right">{alert.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.26] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">DETECTION PIPELINE</h3>
          </div>
          <div className="flex-1 flex flex-col justify-between p-5 relative font-mono">
            <div className="absolute left-[33px] top-8 bottom-8 w-[1px] bg-indigo-900/50"></div>
            {pipelineStages.map((stage, i) => (
              <div key={i} className="flex items-center relative z-10 mb-3 last:mb-0">
                <div className="w-7 h-7 rounded border border-indigo-900/50 bg-[#060913] flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(79,70,229,0.1)] shrink-0">
                  {stage.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-300 leading-tight">{stage.label}</span>
                  <div className="flex items-center mt-0.5">
                    <span className="text-[9px] text-emerald-400 flex items-center tracking-widest">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      {stage.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 lg:flex-[0.26] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-indigo-900/30 bg-[#060913]/50 shrink-0">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">TOP THREAT SOURCES</h3>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center space-y-4 font-mono">
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
    </>
  );
}

// ============================================================================
// LIVE THREAT STREAM
// ============================================================================
function LiveStreamView({ navigateTo, globalSelectedEventId, setGlobalSelectedEventId }) {
  const selectedEvent = globalEventStore.find(e => e.id === globalSelectedEventId) || globalEventStore[0];

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
            {sharedLiveDetections.map((evt) => {
              const isSelected = evt.id === globalSelectedEventId;
              const badgeColor = evt.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                                 evt.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                 evt.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                                 'bg-slate-700/30 text-slate-400 border-slate-600/40';

              return (
                <div 
                  key={evt.id}
                  onClick={() => setGlobalSelectedEventId(evt.id)}
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
                <div>TIMESTAMP: <span className="text-slate-300">{selectedEvent.time || selectedEvent.ts}</span></div>
                <div className="sm:col-span-2 truncate">SOURCE: <span className="text-slate-200">{selectedEvent.src}</span></div>
                <div className="sm:col-span-2 truncate">TARGET: <span className="text-slate-200">{selectedEvent.dst}</span></div>
                <div>ENGINE: <span className="text-purple-400">{selectedEvent.engine || 'Zeek Rules'}</span></div>
                <div>CONFIDENCE: <span className="text-emerald-400">{selectedEvent.conf || '100%'}</span></div>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase tracking-widest mb-2">DETECTION FEATURES</span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  {Object.entries(selectedEvent.features || {}).map(([key, val]) => (
                    <div key={key} className="bg-[#030712] p-1.5 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-500 uppercase truncate pr-2">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={`font-bold ${val === 'HIGH' ? 'text-rose-400' : val === 'MED' ? 'text-amber-400' : 'text-slate-300'}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col space-y-2">
              <button 
                onClick={() => navigateTo('analytics', selectedEvent.id)}
                className="w-full bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 text-purple-300 text-[10px] font-mono tracking-widest uppercase py-2 rounded transition-all active:scale-[0.98] text-center shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              >
                [ VIEW IN THREAT ANALYTICS ]
              </button>
            </div>
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

// ============================================================================
// THREAT ANALYTICS
// ============================================================================
function AnalyticsView({ globalSelectedEventId, navigateTo }) {
  const analyzeRef = useRef(null);
  
  // Single source of truth lookup
  const analyzedEvent = globalSelectedEventId ? globalEventStore.find(e => e.id === globalSelectedEventId) : null;
  const aiResult = analyzedEvent ? simulateAIAnalysis(analyzedEvent, globalEventStore) : null;

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

  const defaultFeatureContribution = [
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

  const defaultDetectionImpact = [
    { name: 'DGA / DNS', events: 312, conf: '96.4%' },
    { name: 'Port Scanning', events: 241, conf: '94.8%' },
    { name: 'Beaconing', events: 198, conf: '93.1%' },
    { name: 'Anomalous Flow', events: 156, conf: '91.7%' },
  ];

  const defaultModelHealth = [
    { name: 'Isolation Forest', status: 'READY' },
    { name: 'Random Forest', status: 'READY' },
    { name: 'XGBoost', status: 'READY' },
    { name: 'Autoencoder', status: 'READY' },
    { name: 'LSTM / DGA', status: 'READY' },
    { name: 'Ensemble', status: 'ACTIVE', isHighlight: true },
  ];

  // Dynamic values based on selected event
  const displayFeatures = aiResult ? aiResult.features : defaultFeatureContribution;

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-5">
      
      {/* CONTEXTUAL EVENT BANNER */}
      {analyzedEvent && (
        <div ref={analyzeRef} className="bg-[#0a0f1c] border border-purple-500/50 p-4 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden">
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
            <div><span className="text-slate-500 block mb-1">THREAT CLASS</span> <span className="text-slate-200 font-bold">{analyzedEvent.title}</span></div>
            <div><span className="text-slate-500 block mb-1">SEVERITY</span> <span className={`${getSeverityColor(analyzedEvent.severity)} px-1.5 py-0.5 rounded text-white font-bold inline-block`}>{analyzedEvent.severity}</span></div>
            <div><span className="text-slate-500 block mb-1">SOURCE</span> <span className="text-slate-200">{analyzedEvent.src}</span></div>
            <div><span className="text-slate-500 block mb-1">ML CONFIDENCE</span> <span className="text-emerald-400 font-bold">{aiResult?.confidence || 'N/A'}</span></div>
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
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{metric.label}</span>
            <span className={`text-lg md:text-xl font-mono font-light tracking-tight ${metric.isGreen ? 'text-emerald-400' : 'text-slate-200'}`}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 shrink-0 min-h-[260px]">
        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4">
          <div className="flex flex-col border-b border-indigo-900/30 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">
              {analyzedEvent ? 'EVENT FEATURE EXPLANATION' : 'RELATIVE FEATURE IMPORTANCE'}
            </h3>
            <span className="text-[9px] font-mono text-purple-400/80 tracking-widest uppercase mt-0.5">
              {analyzedEvent ? '[ SIMULATED EXPLANATION ]' : 'NORMALIZED CONTRIBUTION'}
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

        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4">
          <div className="flex flex-col border-b border-indigo-900/30 pb-3 mb-4">
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase">MODEL INFERENCE LATENCY</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 flex-1 min-h-[160px] mt-4">
        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">
            {aiResult ? 'CORRELATED ACTIVITY' : 'DETECTION IMPACT'}
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-3">
            {aiResult ? (
              aiResult.correlated.length > 0 ? (
                aiResult.correlated.map((impact, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-300 uppercase tracking-widest w-32 truncate">{impact.title}</span>
                    <span className="text-slate-400">{impact.time}</span>
                    <span className={`font-bold ${impact.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>{impact.severity}</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">No recent correlated activity</div>
              )
            ) : (
              defaultDetectionImpact.map((impact, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-300 uppercase tracking-widest w-32">{impact.name}</span>
                  <span className="text-slate-400">{impact.events} events</span>
                  <span className="text-purple-400 font-bold">{impact.conf} conf</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#0a0f1c] border border-indigo-900/30 flex flex-col p-4">
          <h3 className="text-[11px] font-mono font-bold tracking-widest text-slate-300 uppercase border-b border-indigo-900/30 pb-3 mb-4">
            {aiResult ? 'MULTI-MODEL CONSENSUS' : 'MODEL HEALTH'}
          </h3>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono">
            {aiResult ? (
              <>
                {aiResult.models.map((health, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#060913]/50 px-2 py-1.5 border border-slate-800/80 rounded-sm">
                    <span className="text-slate-400 uppercase tracking-widest truncate mr-2">{health.name}</span>
                    <span className={`flex items-center tracking-wider ${health.decision === 'MALICIOUS' ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {health.decision} — {health.conf}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-purple-900/20 px-2 py-1.5 border border-purple-500/50 rounded-sm mt-1 sm:col-span-2">
                  <span className="text-purple-300 font-bold uppercase tracking-widest truncate mr-2">FINAL AI VERDICT</span>
                  <span className={`flex items-center font-bold tracking-widest ${aiResult.verdict === 'MALICIOUS' ? 'text-rose-500' : 'text-amber-500'}`}>
                    {aiResult.verdict}
                  </span>
                </div>
              </>
            ) : (
              defaultModelHealth.map((health, i) => (
                <div key={i} className="flex items-center justify-between bg-[#060913]/50 px-2 py-1.5 border border-slate-800/80 rounded-sm">
                  <span className="text-slate-400 uppercase tracking-widest truncate mr-2">{health.name}</span>
                  <span className={`flex items-center tracking-wider ${health.isHighlight ? 'text-purple-400' : 'text-emerald-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${health.isHighlight ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
                    {health.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZEEK LOGS VIEW
// ============================================================================
function ZeekLogsView({ navigateTo, globalSelectedEventId, setGlobalSelectedEventId, handleFeedback, analystFeedback }) {
  const selectedEvent = globalEventStore.find(e => e.id === globalSelectedEventId) || zeekEventsData[4];
  const [copyStatus, setCopyStatus] = useState('idle');
  
  // AI Assessment State
  const [aiAssessment, setAiAssessment] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Trigger backend adapter call on event selection
  useEffect(() => {
    let isMounted = true;
    setIsAnalyzing(true);
    setAiAssessment(null);

    fetchAIAssessment(selectedEvent).then(result => {
      if (isMounted) {
        setAiAssessment(result);
        setIsAnalyzing(false);
      }
    }).catch(() => {
      if (isMounted) setIsAnalyzing(false);
    });

    return () => { isMounted = false; };
  }, [selectedEvent.id]);

  const handleCopyEvent = async () => {
    if (!selectedEvent.raw) return;
    try {
      const rawEventText = JSON.stringify(selectedEvent.raw, null, 2);
      await navigator.clipboard.writeText(rawEventText);
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
          <div key={i} className="bg-[#0a0f1c] border border-indigo-900/30 p-3 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
            <span className={`text-xl font-light tracking-tight ${stat.color || 'text-slate-200'}`}>{stat.value}</span>
          </div>
        ))}
      </div>

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

      <div className="flex flex-col lg:flex-row gap-4 shrink-0 min-h-[450px]">
        {/* LEFT PANEL: Zeek Event Stream */}
        <div className="flex-1 lg:flex-[0.60] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">LIVE ZEEK EVENT STREAM</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#02040a] p-3 space-y-2.5 text-[11px] leading-relaxed">
            {zeekEventsData.map((evt) => (
              <div 
                key={evt.id}
                onClick={() => setGlobalSelectedEventId(evt.id)}
                className={`p-2.5 border-l-2 cursor-pointer transition-colors ${
                  globalSelectedEventId === evt.id ? 'bg-purple-900/10 border-purple-500' : 'border-transparent hover:bg-slate-800/30'
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

        {/* RIGHT PANEL: Event Inspector & AI Assessment */}
        <div className="flex-1 lg:flex-[0.40] bg-[#0a0f1c] border border-indigo-900/30 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
          <div className="px-4 py-2.5 border-b border-indigo-900/30 bg-[#060913]/50">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">EVENT INSPECTOR</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col text-[10px]">
            {/* Event Metadata */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
              <div><span className="text-slate-500 block mb-0.5">EVENT TYPE</span> <span className={selectedEvent.color}>{selectedEvent.type || selectedEvent.title}</span></div>
              <div><span className="text-slate-500 block mb-0.5">LOG SOURCE</span> <span className="text-slate-300">{selectedEvent.log || 'engine.log'}</span></div>
              <div><span className="text-slate-500 block mb-0.5">TIMESTAMP</span> <span className="text-slate-300">{selectedEvent.ts || selectedEvent.time}</span></div>
              <div><span className="text-slate-500 block mb-0.5">CONNECTION UID</span> <span className="text-purple-400">{selectedEvent.uid || selectedEvent.id}</span></div>
              <div><span className="text-slate-500 block mb-0.5">SOURCE IP</span> <span className="text-slate-300">{selectedEvent.raw?.['id.orig_h'] || selectedEvent.src || '—'}</span></div>
              <div><span className="text-slate-500 block mb-0.5">DESTINATION</span> <span className="text-slate-300">{selectedEvent.raw?.['id.resp_h'] || selectedEvent.dst || '—'}</span></div>
            </div>

            {/* Event Action Utilities */}
            <div className="flex space-x-2 mb-4 pb-4 border-b border-indigo-900/30">
              <button 
                onClick={handleCopyEvent}
                disabled={!selectedEvent.raw}
                className="flex-1 flex items-center justify-center bg-[#060913] border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 py-2 rounded transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copyStatus === 'success' ? 'COPIED ✓' : copyStatus === 'error' ? 'COPY FAILED' : <><Copy className="w-3 h-3 mr-2" /> COPY EVENT</>}
              </button>
              <button 
                onClick={() => navigateTo('analytics', selectedEvent.id)}
                className="flex-1 flex items-center justify-center bg-purple-900/30 border border-purple-500/50 hover:bg-purple-900/50 text-purple-300 py-2 rounded transition-colors uppercase tracking-widest"
              >
                <ActivitySquare className="w-3 h-3 mr-2" /> THREAT STREAM
              </button>
            </div>

            {/* AUTOMATED AI THREAT ASSESSMENT PANEL */}
            <div className="flex-1 flex flex-col space-y-3">
               {isAnalyzing ? (
                 <div className="flex items-center text-slate-400 text-[10px] uppercase tracking-widest p-4 border border-slate-800 bg-[#02040a]">
                   <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                   Analyzing event...
                 </div>
               ) : aiAssessment ? (
                 <>
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center">
                      <Cpu className="w-3 h-3 mr-1.5" /> AI THREAT ASSESSMENT
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-[9px] bg-[#030712] p-2 border border-indigo-900/30 rounded">
                       <div><span className="text-slate-500 block mb-0.5">VERDICT</span> <span className={`font-bold ${aiAssessment.verdict === 'THREAT' ? 'text-rose-500' : 'text-emerald-500'}`}>{aiAssessment.verdict === 'FALSE POSITIVE' ? '✓ FALSE POSITIVE' : '⚠ THREAT'}</span></div>
                       <div><span className="text-slate-500 block mb-0.5">CONFIDENCE</span> <span className="text-slate-200">{(aiAssessment.confidence * 100).toFixed(1)}%</span></div>
                       <div><span className="text-slate-500 block mb-0.5">THREAT TYPE</span> <span className="text-slate-200">{aiAssessment.threat_type}</span></div>
                       <div><span className="text-slate-500 block mb-0.5">SEVERITY</span> <span className="text-slate-200">{aiAssessment.severity}</span></div>
                    </div>

                    <div className="bg-[#030712] p-2 border border-indigo-900/30 rounded text-[9px]">
                       <span className="text-slate-500 block mb-1 uppercase tracking-widest">Why was this flagged?</span>
                       <p className="text-slate-300 leading-relaxed mb-2">{aiAssessment.explanation}</p>
                       <span className="text-slate-500 block mb-1 uppercase tracking-widest">Evidence</span>
                       <ul className="list-disc list-inside text-slate-300 space-y-0.5 ml-1">
                         {aiAssessment.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                       </ul>
                    </div>

                    <div className="bg-[#030712] p-2 border border-indigo-900/30 rounded text-[9px]">
                       <span className="text-slate-500 block mb-1 uppercase tracking-widest">Model Consensus</span>
                       <div className="space-y-1 mb-2">
                         {Object.entries(aiAssessment.model_consensus).map(([modelKey, data]) => (
                           <div key={modelKey} className="flex justify-between items-center">
                              <span className="text-slate-400 capitalize">{modelKey.replace('_', ' ')}</span>
                              <span className="text-slate-300">
                                <span className={data.verdict === 'THREAT' ? 'text-rose-400' : 'text-emerald-400'}>{data.verdict}</span>
                                <span className="ml-2 opacity-70">{(data.confidence * 100).toFixed(0)}%</span>
                              </span>
                           </div>
                         ))}
                       </div>
                       <div className="border-t border-indigo-900/30 pt-1.5 flex justify-between items-center font-bold">
                         <span className="text-purple-400 uppercase">Final AI Decision</span>
                         <span className={aiAssessment.verdict === 'THREAT' ? 'text-rose-500' : 'text-emerald-500'}>{aiAssessment.verdict} — {(aiAssessment.confidence * 100).toFixed(1)}%</span>
                       </div>
                    </div>

                    <div className="bg-purple-900/10 p-2 border border-purple-500/30 rounded text-[9px]">
                       <span className="text-purple-400 block mb-0.5 uppercase tracking-widest font-bold">AI Recommendation</span>
                       <p className="text-slate-300">{aiAssessment.recommended_action}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-indigo-900/30">
                      <span className="text-slate-500 block mb-1.5 text-[9px] uppercase tracking-widest text-center">Analyst Feedback</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleFeedback(selectedEvent.id, 'AGREED_WITH_AI')}
                          className="flex-1 bg-[#060913] hover:bg-emerald-900/20 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-[9px] font-mono tracking-widest uppercase py-2 rounded transition-all text-center"
                        >
                          [ AGREE WITH AI ]
                        </button>
                        <button 
                          onClick={() => handleFeedback(selectedEvent.id, 'OVERRIDE_AI')}
                          className="flex-1 bg-[#060913] hover:bg-amber-900/20 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-[9px] font-mono tracking-widest uppercase py-2 rounded transition-all text-center"
                        >
                          [ OVERRIDE AI ]
                        </button>
                      </div>
                      {analystFeedback[selectedEvent.id] && (
                        <div className="text-[9px] font-mono text-center tracking-widest uppercase text-emerald-400 mt-2 p-1.5 bg-emerald-900/20 border border-emerald-500/30 rounded">
                          STATUS RECORDED: {analystFeedback[selectedEvent.id].label.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                 </>
               ) : (
                 <div className="flex items-center text-slate-500 text-[10px] uppercase tracking-widest p-4 border border-slate-800 bg-[#02040a]">
                   Waiting for backend inference...
                 </div>
               )}
            </div>
            
          </div>
        </div>
      </div>

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
    <div className={`bg-[#0a0f1c] border border-indigo-900/30 flex flex-col relative overflow-hidden group min-h-[110px] ${compact ? 'p-3' : 'p-3 md:p-4'}`}>
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