import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── DATA MODEL ─────────────────────────────────────────────────────────────

const MODULES = [
  { id: 'crm', label: 'CRM', color: '#7c3aed', textColor: '#fff', x: 500, y: 80, type: 'module',
    description: 'Central customer relationship hub. Stores contacts, companies, deals, and all customer interactions.',
    pages: ['Contacts', 'Companies', 'Deals', 'Activities', 'Opportunities', 'Pipeline'],
  },
  { id: 'sales', label: 'Sales', color: '#059669', textColor: '#fff', x: 820, y: 220, type: 'module',
    description: 'Manages the full sales lifecycle from lead to close. Sequences, proposals, meetings, and quotas all live here.',
    pages: ['Sales Dashboard', 'Sales Hub', 'Sales Inbox', 'Sequences', 'Proposals', 'Meeting Scheduler', 'Reservations', 'Sales Quotas'],
  },
  { id: 'marketing', label: 'Marketing', color: '#2563eb', textColor: '#fff', x: 160, y: 220, type: 'module',
    description: 'Demand generation engine. Campaigns, email marketing, landing pages, lead scoring, and automation.',
    pages: ['Marketing Dashboard', 'Marketing Hub', 'Email Marketing', 'Campaigns', 'Landing Pages', 'Automation'],
  },
  { id: 'cs', label: 'Customer Success', color: '#db2777', textColor: '#fff', x: 820, y: 440, type: 'module',
    description: 'Retains and grows existing customers through health scoring, onboarding, feedback, and renewal management.',
    pages: ['CS Dashboard', 'Customer Success', 'Customer Feedback', 'Satisfaction Surveys'],
  },
  { id: 'seo', label: 'SEO & Analytics', color: '#ea580c', textColor: '#fff', x: 160, y: 440, type: 'module',
    description: 'Drives organic growth through keyword tracking, technical audits, backlink analysis, and content performance.',
    pages: ['SEO Dashboard', 'SEO Analytics', 'SEO Audits', 'Keywords', 'Backlinks', 'SEO Opportunities', 'Local SEO'],
  },
  { id: 'social', label: 'Social Media', color: '#0891b2', textColor: '#fff', x: 160, y: 650, type: 'module',
    description: 'Manages social presence across all platforms — scheduling, listening, engagement, and analytics.',
    pages: ['Social Dashboard', 'Social Calendar', 'Social Listening', 'Social Analytics', 'All Channels', 'Social Accounts'],
  },
  { id: 'web', label: 'Web & Analytics', color: '#4f46e5', textColor: '#fff', x: 340, y: 800, type: 'module',
    description: 'Tracks website traffic, user behavior, heatmaps, funnels, and A/B tests to optimize conversion.',
    pages: ['Web Dashboard', 'Web Analytics', 'Advanced Analytics', 'Landing Pages', 'Web Crawler', 'Contact Forms'],
  },
  { id: 'projects', label: 'Projects', color: '#d97706', textColor: '#fff', x: 500, y: 650, type: 'module',
    description: 'Coordinates all internal work — project planning, task management, Kanban boards, sprints, and time tracking.',
    pages: ['Projects Dashboard', 'Projects', 'Project Calendar', 'Team Collaboration'],
  },
  { id: 'hris', label: 'HRIS', color: '#0d9488', textColor: '#fff', x: 660, y: 800, type: 'module',
    description: 'Complete human resources system covering employees, payroll, time off, onboarding, and the full talent lifecycle.',
    pages: ['HRIS Dashboard', 'Employees', 'Org Chart', 'Departments', 'Time Off', 'Payroll', 'Benefits', 'Onboarding', 'Hiring', 'Performance'],
  },
  { id: 'finance', label: 'Finance', color: '#65a30d', textColor: '#fff', x: 820, y: 650, type: 'module',
    description: 'Full financial operations: P&L, budgets, transactions, payroll costs, forecasts, vendor management, and equity.',
    pages: ['Finance Dashboard', 'P&L Statement', 'Budgets', 'Transactions', 'Payroll Costs', 'Forecasts', 'Vendor Space', 'Equity'],
  },
  { id: 'legal', label: 'Legal', color: '#7c3aed', textColor: '#fff', x: 500, y: 440, type: 'module',
    description: 'Manages the legal function including matters, documents, litigation, IP, obligations, and external counsel.',
    pages: ['Legal Dashboard', 'Matters', 'Legal Documents', 'Litigation', 'Obligations', 'IP Assets', 'Counsel', 'Legal Entities'],
  },
  { id: 'compliance', label: 'Compliance', color: '#16a34a', textColor: '#fff', x: 500, y: 240, type: 'module',
    description: 'Enterprise compliance program covering SOC 2, CMMC, policies, audits, risk register, incidents, and export control.',
    pages: ['Compliance Dashboard', 'Executive Summary', 'Policies', 'Training', 'Incidents', 'Audits', 'Risk Register', 'Export Control'],
  },
  { id: 'datarooms', label: 'Data Rooms', color: '#9333ea', textColor: '#fff', x: 340, y: 440, type: 'module',
    description: 'Secure document sharing with access controls, portals for external users, activity tracking, and permission management.',
    pages: ['Data Rooms', 'DocuTrace', 'Portal Access'],
  },
  { id: 'reporting', label: 'Reporting', color: '#c026d3', textColor: '#fff', x: 160, y: 80, type: 'module',
    description: 'Cross-module reporting with custom dashboards, scheduled reports, PDF exports, and white-labeled report sharing.',
    pages: ['Reports Dashboard', 'Reports', 'Takedown Requestor'],
  },
  { id: 'ai', label: 'AI Tools', color: '#8b5cf6', textColor: '#fff', x: 820, y: 80, type: 'module',
    description: 'AI-powered capabilities embedded across the platform — content generation, lead enrichment, forecasting, and assistants.',
    pages: ['AI Dashboard', 'HR AI Assistant', 'Content Studio', 'Lead Enrichment'],
  },
  { id: 'comms', label: 'Communications', color: '#6366f1', textColor: '#fff', x: 660, y: 240, type: 'module',
    description: 'Internal messaging, channels, video calls, whiteboards, file sharing, and presence — the ICS system.',
    pages: ['ICS (Team Chat)', 'Video Calls', 'Channels', 'File Sharing'],
  },
  { id: 'bizdev', label: 'Business Dev', color: '#0369a1', textColor: '#fff', x: 340, y: 80, type: 'module',
    description: 'Aerospace and business intelligence scanning, competitor analysis, visitor profiles, listings, and press monitoring.',
    pages: ['Business Dev Dashboard', 'Aerospace Scanner', 'Competitor Analysis', 'Visitor Profiles', 'Listings & Reviews', 'Press Monitoring', 'DocuTrace'],
  },
];

// Edge definition: [fromId, toId, label, color, description]
const EDGES = [
  // CRM as hub
  ['crm', 'sales', 'Qualified leads → pipeline', '#059669', 'Contacts and deals flow from CRM into Sales sequences and pipeline management'],
  ['crm', 'marketing', 'Contacts → campaigns', '#2563eb', 'CRM contacts are targeted by Marketing campaigns; lead scores flow back to CRM'],
  ['crm', 'cs', 'Won deals → onboarding', '#db2777', 'Closed-won deals in CRM trigger Customer Success onboarding workflows'],
  ['crm', 'datarooms', 'Deals → document sharing', '#9333ea', 'Deals link to Data Rooms for secure document exchange with prospects'],
  ['crm', 'legal', 'Contacts → contracts', '#7c3aed', 'CRM contacts and companies are referenced in Legal documents and matters'],
  ['crm', 'reporting', 'Pipeline data → reports', '#c026d3', 'CRM pipeline and activity data powers cross-module executive reports'],
  // Marketing → others
  ['marketing', 'crm', 'MQLs → contacts', '#7c3aed', 'Marketing qualified leads are created as Contacts in CRM with source attribution'],
  ['marketing', 'seo', 'Content strategy ↔ keywords', '#ea580c', 'Marketing content calendar is informed by SEO keyword opportunities'],
  ['marketing', 'social', 'Campaigns → posts', '#0891b2', 'Marketing campaigns coordinate with Social Media scheduling and publishing'],
  ['marketing', 'web', 'Landing pages → traffic', '#4f46e5', 'Marketing landing pages and campaigns drive traffic measured in Web Analytics'],
  ['marketing', 'reporting', 'Campaign ROI → reports', '#c026d3', 'Marketing campaign performance and ROI are included in executive reports'],
  // Sales → others
  ['sales', 'finance', 'Won deals → revenue', '#65a30d', 'Closed deals in Sales create revenue transactions in Finance and update forecasts'],
  ['sales', 'legal', 'Proposals → contracts', '#7c3aed', 'Sales proposals convert into Legal contracts requiring review and signature'],
  ['sales', 'cs', 'Handoff → onboarding', '#db2777', 'Sales closes deals and formally hands off customers to Customer Success'],
  ['sales', 'comms', 'Sales inbox → messages', '#6366f1', 'Sales email and call activities sync with the ICS communications system'],
  ['sales', 'ai', 'Lead enrichment', '#8b5cf6', 'AI enriches lead profiles with company intelligence and conversation insights'],
  // Finance → others
  ['finance', 'hris', 'Payroll costs ↔ headcount', '#0d9488', 'Finance payroll module pulls salary data from HRIS employee records'],
  ['finance', 'legal', 'Contracts → spend tracking', '#7c3aed', 'Legal contracts are tracked as financial commitments in Finance vendor space'],
  ['finance', 'reporting', 'P&L → executive reports', '#c026d3', 'Finance P&L, budgets, and forecasts feed into executive and board reports'],
  ['finance', 'compliance', 'Audit evidence → controls', '#16a34a', 'Finance transaction records serve as audit evidence for SOC 2 and CMMC compliance'],
  // HRIS → others
  ['hris', 'finance', 'Salaries → payroll costs', '#65a30d', 'HRIS employee salaries and payroll runs feed directly into Finance payroll costs'],
  ['hris', 'compliance', 'Training records → controls', '#16a34a', 'HRIS training completion records satisfy Compliance training control requirements'],
  ['hris', 'projects', 'Team members → tasks', '#d97706', 'HRIS employee data is used to assign team members to Projects and tasks'],
  ['hris', 'reporting', 'Headcount → reports', '#c026d3', 'HRIS headcount, diversity, and turnover metrics appear in executive reports'],
  // Compliance → others
  ['compliance', 'legal', 'Policies → obligations', '#7c3aed', 'Compliance policies link to Legal obligations and regulatory requirements'],
  ['compliance', 'datarooms', 'Evidence → secure storage', '#9333ea', 'Compliance evidence files are stored and shared via secure Data Rooms'],
  ['compliance', 'reporting', 'SOC2 status → reports', '#c026d3', 'Compliance program status and control gaps feed into executive reports'],
  ['compliance', 'ai', 'Evidence scanning', '#8b5cf6', 'AI scans compliance evidence documents for sensitive data and risks'],
  // Legal → others
  ['legal', 'datarooms', 'Docs → secure sharing', '#9333ea', 'Legal documents are shared externally via Data Room portals with access controls'],
  ['legal', 'compliance', 'Obligations → controls', '#16a34a', 'Legal obligations map to Compliance controls that must be implemented'],
  // CS → others
  ['cs', 'crm', 'Health scores → CRM', '#7c3aed', 'Customer health scores and interaction history flow back to CRM contact records'],
  ['cs', 'finance', 'Renewals → revenue', '#65a30d', 'Customer Success manages renewals that update revenue forecasts in Finance'],
  // Business Dev → others
  ['bizdev', 'crm', 'Prospects → contacts', '#7c3aed', 'Aerospace scanner and competitor analysis create new leads/contacts in CRM'],
  ['bizdev', 'marketing', 'Market intel → campaigns', '#2563eb', 'Business intelligence informs Marketing campaign targeting and messaging'],
  ['bizdev', 'datarooms', 'M&A docs → rooms', '#9333ea', 'Business development deals use Data Rooms for secure document exchange'],
  // Social → others
  ['social', 'marketing', 'Engagement → leads', '#2563eb', 'Social listening and lead generation feed prospects into Marketing and CRM'],
  ['social', 'reporting', 'Social metrics → reports', '#c026d3', 'Social media performance metrics are included in executive reporting dashboards'],
  // SEO → others
  ['seo', 'web', 'Rankings → traffic', '#4f46e5', 'SEO keyword rankings and technical audits directly impact Web Analytics traffic'],
  ['seo', 'reporting', 'SEO metrics → reports', '#c026d3', 'SEO performance data including rankings and backlinks feeds into reports'],
  // Web → others
  ['web', 'crm', 'Visitors → leads', '#7c3aed', 'Web visitor identification and form submissions create new CRM contacts'],
  ['web', 'marketing', 'Conversion data → optimization', '#2563eb', 'Web conversion rates and funnel data optimize Marketing campaign performance'],
  // Projects → others
  ['projects', 'hris', 'Tasks → team', '#0d9488', 'Projects use HRIS employee data for team assignment, time tracking, and workload'],
  ['projects', 'comms', 'Updates → chat', '#6366f1', 'Project updates and task changes trigger notifications in ICS team channels'],
  // AI → others
  ['ai', 'crm', 'Enriched data', '#7c3aed', 'AI enriches CRM contact and company data with intelligence from multiple sources'],
  ['ai', 'marketing', 'Content generation', '#2563eb', 'AI generates marketing content, email copy, and campaign ideas for the team'],
  ['ai', 'hris', 'HR assistant', '#0d9488', 'AI assistant answers HR policy questions and assists with employee analytics'],
  // Comms → others
  ['comms', 'projects', 'Channel → project updates', '#d97706', 'ICS channels are linked to Projects for contextual team communication'],
  // Reporting → others
  ['reporting', 'ai', 'AI insights', '#8b5cf6', 'AI generates automated insights and anomaly detection within Reports'],
];

const NODE_W = 120;
const NODE_H = 44;
const CANVAS_W = 1020;
const CANVAS_H = 920;

// Build edge color map for legend
const CONNECTION_TYPES = [
  { color: '#7c3aed', label: 'CRM / Legal connections' },
  { color: '#059669', label: 'Sales flow' },
  { color: '#2563eb', label: 'Marketing flow' },
  { color: '#db2777', label: 'Customer Success flow' },
  { color: '#ea580c', label: 'SEO flow' },
  { color: '#0891b2', label: 'Social flow' },
  { color: '#4f46e5', label: 'Web flow' },
  { color: '#d97706', label: 'Project flow' },
  { color: '#0d9488', label: 'HRIS flow' },
  { color: '#65a30d', label: 'Finance flow' },
  { color: '#16a34a', label: 'Compliance flow' },
  { color: '#9333ea', label: 'Data Room flow' },
  { color: '#c026d3', label: 'Reporting flow' },
  { color: '#8b5cf6', label: 'AI flow' },
  { color: '#6366f1', label: 'Communications flow' },
  { color: '#0369a1', label: 'Business Dev flow' },
];

function getModuleById(id) {
  return MODULES.find(m => m.id === id);
}

function getEdgesForNode(nodeId) {
  return EDGES.filter(e => e[0] === nodeId || e[1] === nodeId);
}

export default function PlatformWorkflowMap() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const svgRef = useRef(null);

  const activeEdges = selectedNode
    ? getEdgesForNode(selectedNode.id)
    : hoveredNode
    ? getEdgesForNode(hoveredNode.id)
    : [];

  const activeNodeIds = new Set(activeEdges.flatMap(e => [e[0], e[1]]));
  const isFiltered = activeNodeIds.size > 0;

  // Pan handlers
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('.node-group')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!isPanning || !panStart.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [isPanning]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.min(2, Math.max(0.4, z - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const handleNodeClick = (module) => {
    setSelectedNode(prev => prev?.id === module.id ? null : module);
  };

  const connectedEdgeDetails = selectedNode ? getEdgesForNode(selectedNode.id) : [];

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Workflow Map</h1>
          <p className="text-xs text-gray-400 mt-0.5">Click any module to explore its connections • Scroll to zoom • Drag to pan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLegend(l => !l)} className="text-xs border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            <Info className="w-3.5 h-3.5 mr-1" /> Legend
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setZoom(0.9); setPan({ x: 0, y: 0 }); }} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <defs>
              {CONNECTION_TYPES.map(ct => (
                <marker
                  key={ct.color}
                  id={`arrow-${ct.color.replace('#', '')}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill={ct.color} />
                </marker>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Background grid */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth="0.5" />
              </pattern>
              <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#grid)" />

              {/* Edges */}
              {EDGES.map((edge, i) => {
                const from = getModuleById(edge[0]);
                const to = getModuleById(edge[1]);
                if (!from || !to) return null;
                const isActive = activeEdges.some(ae => ae === edge);
                const isDimmed = isFiltered && !isActive;

                const x1 = from.x + NODE_W / 2;
                const y1 = from.y + NODE_H / 2;
                const x2 = to.x + NODE_W / 2;
                const y2 = to.y + NODE_H / 2;

                // Curve control points
                const dx = x2 - x1;
                const dy = y2 - y1;
                const cx1 = x1 + dx * 0.4 + dy * 0.15;
                const cy1 = y1 + dy * 0.4 - dx * 0.15;
                const cx2 = x1 + dx * 0.6 + dy * 0.15;
                const cy2 = y1 + dy * 0.6 - dx * 0.15;

                return (
                  <g key={i}>
                    <path
                      d={`M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`}
                      fill="none"
                      stroke={edge[3]}
                      strokeWidth={isActive ? 2.5 : 1.2}
                      strokeOpacity={isDimmed ? 0.05 : isActive ? 1 : 0.3}
                      markerEnd={`url(#arrow-${edge[3].replace('#', '')})`}
                      filter={isActive ? 'url(#glow)' : undefined}
                    />
                    {isActive && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fill={edge[3]}
                        opacity={0.9}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {edge[2]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {MODULES.map(module => {
                const isSelected = selectedNode?.id === module.id;
                const isHov = hoveredNode?.id === module.id;
                const isDimmed = isFiltered && !activeNodeIds.has(module.id) && !isSelected;
                const isConnected = activeNodeIds.has(module.id) && !isSelected;

                return (
                  <g
                    key={module.id}
                    className="node-group"
                    transform={`translate(${module.x}, ${module.y})`}
                    onClick={() => handleNodeClick(module)}
                    onMouseEnter={() => setHoveredNode(module)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow ring for selected */}
                    {isSelected && (
                      <rect
                        x={-4} y={-4}
                        width={NODE_W + 8} height={NODE_H + 8}
                        rx={10}
                        fill="none"
                        stroke={module.color}
                        strokeWidth={3}
                        opacity={0.6}
                        filter="url(#glow)"
                      />
                    )}
                    {/* Connection indicator ring */}
                    {isConnected && !isSelected && (
                      <rect
                        x={-2} y={-2}
                        width={NODE_W + 4} height={NODE_H + 4}
                        rx={8}
                        fill="none"
                        stroke={module.color}
                        strokeWidth={1.5}
                        opacity={0.5}
                      />
                    )}
                    {/* Main node */}
                    <rect
                      width={NODE_W} height={NODE_H}
                      rx={7}
                      fill={module.color}
                      opacity={isDimmed ? 0.15 : isSelected ? 1 : isHov ? 0.9 : 0.8}
                      stroke={module.color}
                      strokeWidth={1}
                    />
                    {/* Label */}
                    <text
                      x={NODE_W / 2} y={NODE_H / 2}
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fontSize={module.label.length > 12 ? 9.5 : 11}
                      fontWeight="600"
                      fill={module.textColor}
                      opacity={isDimmed ? 0.2 : 1}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {module.label}
                    </text>
                    {/* Page count badge */}
                    <g opacity={isDimmed ? 0.1 : 0.9}>
                      <circle cx={NODE_W - 8} cy={8} r={8} fill="rgba(0,0,0,0.4)" />
                      <text x={NODE_W - 8} y={8} dominantBaseline="middle" textAnchor="middle" fontSize={7} fill="#fff" fontWeight="700" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {module.pages.length}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Right panel: node detail */}
        {selectedNode && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm shrink-0" style={{ background: selectedNode.color }} />
                <h2 className="font-bold text-lg text-white leading-tight">{selectedNode.label}</h2>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 text-sm">
              {/* Description */}
              <div>
                <p className="text-gray-300 leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Pages */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages in this module</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.pages.map(p => (
                    <span key={p} className="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-300">{p}</span>
                  ))}
                </div>
              </div>

              {/* Connections */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Connections ({connectedEdgeDetails.length})
                </h3>
                <div className="space-y-2">
                  {connectedEdgeDetails.map((edge, i) => {
                    const isOut = edge[0] === selectedNode.id;
                    const otherId = isOut ? edge[1] : edge[0];
                    const other = getModuleById(otherId);
                    return (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: edge[3] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-gray-500 text-xs">{isOut ? '→' : '←'}</span>
                            <span className="text-white font-medium text-xs truncate">{other?.label}</span>
                          </div>
                          <p className="text-gray-400 text-xs leading-snug">{edge[4]}</p>
                          <span className="text-xs italic" style={{ color: edge[3] }}>{edge[2]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {showLegend && !selectedNode && (
          <div className="w-56 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Connection Legend</h3>
              <button onClick={() => setShowLegend(false)} className="text-gray-600 hover:text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1.5 text-xs">
              {CONNECTION_TYPES.map(ct => (
                <div key={ct.color} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <div className="w-6 h-0.5 rounded" style={{ background: ct.color }} />
                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent" style={{ borderLeftColor: ct.color }} />
                  </div>
                  <span className="text-gray-400 leading-tight">{ct.label}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-800 space-y-1.5 text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-600 flex items-center justify-center text-white text-xs font-bold">5</div>
                  <span>Badge = # of pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-violet-500 bg-violet-800" />
                  <span>Ring = selected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}