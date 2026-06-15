import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import {
  Shield,
  Sparkles,
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  Trash2,
  RotateCcw,
  FileText,
  User,
  Activity,
  ThumbsUp,
  Droplet,
  Trash,
  CheckSquare,
  Download
} from "lucide-react";

import { IssueTicket, UserRole, UserProfile, DepartmentInfo, AuditReport, IssueCategory, IssueSeverity } from "./types";
import { INITIAL_ISSUES, INITIAL_DEPARTMENTS, INITIAL_ANALYTICS, MOCK_IMAGES, CITY_CENTER } from "./lib/seeds";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CityMap from "./components/CityMap";
import CityCharts from "./components/CityCharts";
import { analyzeIssueWithAI } from "./lib/api";
import { generateIssuesPDF } from "./utils/pdfGenerator";

export default function App() {
  // 1. Core States
  const [currentRole, setCurrentRole] = useState<UserRole>("citizen");
  const [activeTab, setActiveTab] = useState<string>("landing");

  // User profiles
  const [userProfile, setUserProfile] = useState<UserProfile>({
    uid: "demo_citizen_007",
    displayName: "Alex Vance",
    email: "alex@municipal.gov",
    role: "citizen",
    createdAt: new Date().toISOString(),
  });

  // Track issues, departments, and general system audit logs
  const [issues, setIssues] = useState<IssueTicket[]>(INITIAL_ISSUES);
  const [departments, setDepartments] = useState<DepartmentInfo[]>(INITIAL_DEPARTMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditReport[]>([
    { id: "log_initial_1", issueId: "issue_001", type: "Visual Audit Log", description: "Report for Market St Pothole entered terminal state (High priority)", createdAt: new Date(Date.now() - 3.2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "log_initial_2", issueId: "issue_002", type: "Dispatch Active", description: "Water Segment C pipeline isolate orders sent to engineering grid", createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
  ]);

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Sync role swapper changes into the currentUser profile
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setUserProfile((prev) => ({
      ...prev,
      role: role,
      displayName: role === "citizen" ? "Alex Vance" : role === "officer" ? "Officer Irina" : "Administrator Marcus",
    }));
  };

  // 2. Submit Issue Form States
  const [formDescription, setFormDescription] = useState("");
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formLat, setFormLat] = useState<number>(CITY_CENTER.lat);
  const [formLng, setFormLng] = useState<number>(CITY_CENTER.lng);
  const [formLocName, setFormLocName] = useState("Market Boulevard Grid Area");

  // Loading and AI stages during Vision Diagnostics
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStageMessage, setAiStageMessage] = useState("");

  // Storage of temporarily analyzed AI ticket before committing/posting
  const [analyzedDraft, setAnalyzedDraft] = useState<{
    category: IssueCategory;
    confidenceScore: number;
    severity: IssueSeverity;
    severityScore: number;
    assignedDepartment: string;
    suggestedAction: string;
    complaintText: string;
  } | null>(null);

  // Drag and drop state indicators
  const [isDragging, setIsDragging] = useState(false);

  // Officer interactive resolution updates
  const [officerNotes, setOfficerNotes] = useState("");

  // Form image sandbox presets for quick testing
  const sandboxPresets = [
    { label: "Pothole Visual Asset", key: "Pothole", icon: "🛣️" },
    { label: "Garbage Pile Asset", key: "Garbage", icon: "🗑️" },
    { label: "Water Leak Asset", key: "Water Leakage", icon: "💧" },
    { label: "Broken Lamp Asset", key: "Broken Streetlight", icon: "💡" },
    { label: "Open Cover Asset", key: "Open Manhole", icon: "🕳️" },
  ];

  // 3. Automated status stages logger messages
  const loadingStages = [
    "Spinning up CityPulse Vision diagnostics...",
    "Sending visual bytes to Gemini Vision endpoint...",
    "Gemini parsing incident category algorithms...",
    "Detecting safety hazard severity score details...",
    "Routing task to appropriate public branch...",
    "Synthesizing formal municipal complaint file...",
  ];

  // Simulate loading stages smoothly to provide amazing premium feedback
  const triggerAiAnalysis = async () => {
    if (!formPhoto) return;
    setIsAnalyzing(true);
    setAnalyzedDraft(null);

    // Staggered status messages
    let stage = 0;
    const interval = setInterval(() => {
      if (stage < loadingStages.length - 1) {
        setAiStageMessage(loadingStages[stage]);
        stage++;
      }
    }, 900);

    try {
      setAiStageMessage(loadingStages[0]);
      const result = await analyzeIssueWithAI(formPhoto, formDescription);
      clearInterval(interval);
      setAiStageMessage("Analysis compiled successfully. Appending draft.");

      setAnalyzedDraft({
        category: (result.category as IssueCategory) || "Garbage",
        confidenceScore: result.confidenceScore || 0.95,
        severity: (result.severity as IssueSeverity) || "Medium",
        severityScore: result.severityScore || 50,
        assignedDepartment: result.assignedDepartment || "Municipal Office",
        suggestedAction: result.suggestedAction || "Proceed with emergency site verification.",
        complaintText: result.complaintText || "No complaint summary could be generated.",
      });
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      alert("Error contacting Gemini Vision. Please check connectivity.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Drag & drop file capture handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.match("image.*")) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormPhoto(event.target.result as string);
        setAnalyzedDraft(null); // Reset draft
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Add the draft report into live database listings
  const handlePostTicket = () => {
    if (!analyzedDraft || !formPhoto) return;

    const newTicketId = "ticket_" + Math.random().toString(36).substr(2, 9);
    const newTicket: IssueTicket = {
      id: newTicketId,
      reporterId: userProfile.uid,
      reporterName: userProfile.displayName,
      photoUrl: formPhoto,
      latitude: formLat,
      longitude: formLng,
      locationName: formLocName || "New City Sector GPS Block",
      description: formDescription || "No manual description added.",
      category: analyzedDraft.category,
      confidenceScore: analyzedDraft.confidenceScore,
      severity: analyzedDraft.severity,
      severityScore: analyzedDraft.severityScore,
      assignedDepartment: analyzedDraft.assignedDepartment,
      complaintText: analyzedDraft.complaintText,
      suggestedAction: analyzedDraft.suggestedAction,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIssues((prev) => [newTicket, ...prev]);

    // Log the transaction
    const newLog: AuditReport = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      issueId: newTicketId,
      type: "Report Filed",
      description: `New automated complaint recorded for category '${newTicket.category}' in '${newTicket.locationName}' by client. Status: Pending.`,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Update departments statistics counters
    setDepartments((prev) =>
      prev.map((d) =>
        d.name === newTicket.assignedDepartment
          ? { ...d, issueCount: d.issueCount + 1 }
          : d
      )
    );

    // Form cleanup
    setFormDescription("");
    setFormPhoto(null);
    setAnalyzedDraft(null);

    // Move to citizen dashboard to track the resolution timeline!
    setSelectedIssueId(newTicketId);
    setActiveTab("details");
  };

  // Administrative / Officer trigger to update ticket lifecycle states
  const handleUpdateStatus = (issueId: string, nextStatus: "Pending" | "In Progress" | "Resolved") => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          const isResolved = nextStatus === "Resolved";
          return {
            ...issue,
            status: isResolved ? "Resolved" : nextStatus,
            resolutionNotes: officerNotes || issue.resolutionNotes,
            resolutionDate: isResolved ? new Date().toISOString() : issue.resolutionDate,
            updatedAt: new Date().toISOString(),
          };
        }
        return issue;
      })
    );

    const targetIssue = issues.find((i) => i.id === issueId);

    // Log the modification audit
    const newLog: AuditReport = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      issueId,
      type: "Status Changed",
      description: `Incident status transitioned to '${nextStatus}' by ${userProfile.displayName}. Notes: ${officerNotes || "None assigned."}`,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Increment resolved metrics if necessary
    if (nextStatus === "Resolved" && targetIssue && targetIssue.status !== "Resolved") {
      setDepartments((prev) =>
        prev.map((d) =>
          d.name === targetIssue.assignedDepartment
            ? { ...d, resolvedCount: d.resolvedCount + 1 }
            : d
        )
      );
    }

    setOfficerNotes("");
  };

  // administrative reset database to fresh default state
  const handleResetSystem = () => {
    if (confirm("Reset CityPulse AI sandbox data back to factory seeds?")) {
      setIssues(INITIAL_ISSUES);
      setDepartments(INITIAL_DEPARTMENTS);
      setAuditLogs([
        { id: "log_reset", issueId: "system", type: "Database Reset", description: "All database stores re-synchronized against visual startup structures", createdAt: new Date().toISOString() },
      ]);
      setSelectedIssueId(null);
      alert("System restored successfully!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 text-slate-800 antialiased" id="city-pulse-app">
      {/* Dynamic Header Component */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userProfile.displayName}
      />

      {/* Pages View Controller */}
      <main className="flex-grow">
        
        {/* TAB 1: LANDING/MARKETING PAGE */}
        {activeTab === "landing" && (
          <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="landing-view">
            
            {/* HERO SECTION */}
            <div className="text-center space-y-6 max-w-4xl mx-auto py-12" id="landing-hero">
              <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs uppercase px-3.5 py-1.5 rounded-full border border-blue-100/50 animate-pulse">
                <span>⚡ Smart Cities Diagnostic Core</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-sans leading-none">
                See a Problem. Snap a Photo. <br />
                <span className="text-blue-600 bg-clip-text">Improve Your City.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed font-sans">
                Turn passive concern into positive civic action. Upload a photograph of any municipal defect—from deep potholes to broken grid lighting. Our server-side Gemini Vision AI classifies severity and routes complaints to dispatchers instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => setActiveTab("report")}
                  className="w-full sm:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-extrabold transition-all duration-200 shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                  id="landing-report-btn"
                >
                  <Camera className="h-4.5 w-4.5" />
                  <span>Report An Issue Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 rounded-2xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center space-x-2"
                  id="landing-explore-btn"
                >
                  <MapPin className="h-4.5 w-4.5 text-blue-500" />
                  <span>Explore GIS Live Map</span>
                </button>
              </div>
            </div>

            {/* SUSTAINABILITY DASHBOARD METRICS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6" id="sustainability-summary">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs uppercase font-extrabold border border-emerald-100/50">Eco-Grid</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sustainability Impact Dashboard</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Quantifiable ecological benefit score tracking completed since platform inception. Keep our environment green and safe.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-2.5 text-center flex-shrink-0">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-600 block">Civic Impact Score</span>
                  <span className="text-2xl font-black font-sans block">88 / 100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Issues Resolved</span>
                  <span className="text-xl font-extrabold text-slate-800 block">39 Cases</span>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                  <Droplet className="h-5 w-5 text-blue-600" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Water Saved</span>
                  <span className="text-xl font-extrabold text-slate-800 block">1,250 kL</span>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                  <Trash className="h-5 w-5 text-amber-600" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Waste Removed</span>
                  <span className="text-xl font-extrabold text-slate-800 block">8.4 Tons</span>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-1">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Road Repairs</span>
                  <span className="text-xl font-extrabold text-slate-800 block">9 Sections</span>
                </div>
              </div>
            </div>

            {/* BENTO GRID: DETAILS & HOW IT WORKS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-how-it-works">
              
              <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-base">
                  01
                </div>
                <h3 className="font-sans font-extrabold text-slate-950 text-base">See & Snap</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Notice a civic problem anywhere (water leaks, open manholes, potholes). Capture a quick snap using your camera or click to select a preset.
                </p>
              </div>

              <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-base">
                  02
                </div>
                <h3 className="font-sans font-extrabold text-slate-950 text-base">AI Classification</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Our integrated server-side Gemini Vision API instantly analyzes metadata. It extracts severity level and constructs a formal municipal application letter.
                </p>
              </div>

              <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-base">
                  03
                </div>
                <h3 className="font-sans font-extrabold text-slate-950 text-base">Authority Resolve</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Department dispatch grids instantly allocate crew units. Officers inspect cases, update ticket logs, and write resolution certificates.
                </p>
              </div>

            </div>

            {/* CUSTOMER SUCCESS STORY - NOTION INSPIRED */}
            <div className="bg-slate-50 border border-slate-100/80 rounded-3xl p-8 space-y-6" id=" testimonials-section">
              <div className="text-center max-w-md mx-auto space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">Community Board</span>
                <h3 className="font-sans font-bold text-slate-900 text-lg">Vigilant Voices</h3>
                <p className="text-xs text-slate-500 font-medium">Real reviews submitted by active community members.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <p className="text-[12.5px] font-medium text-slate-600 italic">
                    “An open manhole lid in our alley had been ignored for 3 weeks. Uploaded the photo through CityPulse and it classified as 'Critical'. The local Roads team re-paved and seated it the very next afternoon!”
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold font-sans flex items-center justify-center">SC</div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Sarah Connor</span>
                      <span className="text-[10px] font-mono text-slate-400">Citizen Reporter #192</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
                  <p className="text-[12.5px] font-medium text-slate-600 italic">
                    “As a public roads engineer, tracking work orders was a complete mess. The automated Gemini complaint generator provides all raw severity ratings, exact GPS links, and structural hazard scopes beforehand.”
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="h-8 w-8 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold font-sans flex items-center justify-center">IP</div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Irina Petrova</span>
                      <span className="text-[10px] font-mono text-slate-400">Road Department Officer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CITIZEN DASHBOARD (MAP + SUBMITTED HISTORY) */}
        {activeTab === "dashboard" && (
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8" id="citizen-dashboard-view">
            
            {/* Split layout: Upper Map view */}
            <div id="gis-split-map">
              <CityMap
                issues={issues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(issueId) => {
                  setSelectedIssueId(issueId);
                  setActiveTab("details");
                }}
                interactive={true}
              />
            </div>

            {/* Submitted History Grid listings */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4" id="incident-history-grid">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-base">Civic Incident Ledger</h3>
                  <p className="text-xs text-slate-500 font-medium">Browse active city-wide ticket lifecycles and historical details.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500">Active Reports: {issues.length}</span>
                  <button
                    onClick={() => generateIssuesPDF(issues, userProfile.displayName)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                    id="download-report-button"
                    title="Export current issues list to a formal PDF summary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Report</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("report")}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                    id="submit-shortcut-button"
                  >
                    <span>File New Report</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {issues.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-slate-400 text-xs italic">No issues filed in this city sandbox yet.</p>
                  <button onClick={() => setActiveTab("report")} className="text-blue-500 text-xs font-bold underline">Report one now</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {issues.map((issue) => {
                    const isCritical = issue.status === "Critical";
                    return (
                      <div
                        key={issue.id}
                        className="border border-slate-100 rounded-2xl p-4 space-y-4 flex flex-col justify-between hover:border-slate-200 transition-colors shadow-sm bg-slate-50/20"
                        id={`ticket-card-${issue.id}`}
                      >
                        <div className="space-y-3">
                          <div className="relative h-40 w-full overflow-hidden rounded-xl bg-slate-200 border border-slate-100">
                            <img
                              src={issue.photoUrl}
                              alt={issue.category}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
                              <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full border shadow-sm ${
                                issue.status === "Resolved"
                                  ? "bg-emerald-500 text-white border-emerald-400"
                                  : issue.status === "In Progress"
                                  ? "bg-amber-500 text-white border-amber-400"
                                  : isCritical
                                  ? "bg-red-500 text-white border-red-400"
                                  : "bg-blue-600 text-white border-blue-400"
                              }`}>
                                {issue.status}
                              </span>
                              <span className={`text-[9px] font-bold font-sans px-1.5 py-0.5 rounded-full ${
                                issue.severity === "Critical" ? "bg-red-50 text-red-600 border border-red-200" : "bg-slate-900 text-white"
                              }`}>
                                {issue.severity} Severity
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400">Ticket #{issue.id}</span>
                            <h4 className="font-sans font-bold text-slate-800 text-sm line-clamp-1">{issue.category}</h4>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed h-10">{issue.description}</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-50 pt-3 flex items-center justify-between mt-2">
                          <div className="flex flex-col text-[10px] font-mono text-slate-400">
                            <span>📍 {issue.locationName.split(",")[0]}</span>
                            <span>📅 {new Date(issue.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedIssueId(issue.id);
                              setActiveTab("details");
                            }}
                            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all"
                            id={`card-view-btn-${issue.id}`}
                          >
                            Inspection Log
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: REPORT ISSUE FORM PAGE */}
        {activeTab === "report" && (
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8" id="report-form-view">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900">Incident Diagnostic Terminal</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Place coordinate pins, upload photo data, and engage server side Gemini Vision heuristics.</p>
              </div>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                id="back-citizens-panel"
              >
                Cancel & Return
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form Input Side */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Visual file uploader container (drag-and-drop & click supported) */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase text-slate-400">Photo Evidence Capture</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-input")?.click()}
                    className={`h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
                      isDragging ? "border-blue-500 bg-blue-50/20" : "border-slate-200 hover:bg-slate-50/50"
                    }`}
                    id="evidence-filebox"
                  >
                    <input
                      type="file"
                      id="file-input"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {formPhoto ? (
                      <div className="relative h-full w-full flex items-center justify-center">
                        <img
                          src={formPhoto}
                          alt="Evidence preview"
                          className="h-full w-auto max-h-48 rounded-xl object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormPhoto(null);
                            setAnalyzedDraft(null);
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow"
                          id="clear-photo-btn"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl mx-auto flex items-center justify-center shadow-inner shadow-blue-100/50">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Drag & drop your photograph here, or click to browse</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">Accepts JPG, PNG formats up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Developer Sandbox preset loader */}
                {!formPhoto && (
                  <div className="space-y-2.5 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-extrabold block">Sandbox Visual Presets</span>
                    <p className="text-[10px] text-slate-500 font-medium">To test Gemini Vision instantly without uploading your own photo, click one of our cataloged hazard images:</p>
                    <div className="flex flex-wrap gap-2">
                      {sandboxPresets.map((preset) => (
                        <button
                          key={preset.key}
                          onClick={() => {
                            setFormPhoto(MOCK_IMAGES[preset.key as IssueCategory]);
                            setAnalyzedDraft(null);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 flex items-center space-x-1 transition-colors"
                          id={`preset-${preset.key}`}
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location / Latitude Latitude coords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-bold uppercase text-slate-400">Target Neighborhood GPS Location</label>
                    <input
                      type="text"
                      value={formLocName}
                      onChange={(e) => setFormLocName(e.target.value)}
                      placeholder="e.g. 84 Market Boulevard, Center"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-bold uppercase text-slate-400">GIS Coordinates (latitude, longitude)</label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <span>Lat: {formLat.toFixed(4)}</span>
                      <span>Lng: {formLng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                {/* Manual Context Description block */}
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-slate-400">Citizen Observation Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide description context or specifics to help Gemini and municipal engineers prioritize resolving the issue..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="form-textarea-description"
                  />
                </div>

                {/* Actions Trigger */}
                <div className="pt-2">
                  <button
                    onClick={triggerAiAnalysis}
                    disabled={!formPhoto || isAnalyzing}
                    className="w-full py-3.5 bg-blue-600 disabled:bg-slate-200 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-blue-100 flex items-center justify-center space-x-2"
                    id="analyze-evidence-btn"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <span className="h-3 w-3 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        <span>Running Diagnostics...</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Run Gemini AI Vision Diagnostic Analysis</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* AI Diagnostic Report Output pane */}
              <div className="space-y-6">
                
                {/* SVG/Map snippet to select coordinate targets manually */}
                <CityMap
                  issues={[]}
                  selectedIssueId={null}
                  onSelectIssue={() => {}}
                  onCoordinateSelected={(lat, lng) => {
                    setFormLat(lat);
                    setFormLng(lng);
                    setFormLocName(`GPS Block Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                  }}
                  interactive={true}
                />

                {/* Gemini analysis dynamic loader or draft card */}
                {isAnalyzing && (
                  <div className="p-8 border-2 border-dashed border-blue-200 bg-blue-50/10 rounded-3xl text-center space-y-4 animate-fade-in" id="vision-loader">
                    <div className="h-10 w-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-spin mx-auto text-sm">
                      🌀
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 capitalize animate-pulse">{aiStageMessage}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Running secure server-side models on your uploaded packet...</p>
                    </div>
                  </div>
                )}

                {/* COMPLETED REPORT CARD DRAFT (Ready to Commit) */}
                {analyzedDraft && !isAnalyzing && (
                  <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 space-y-5 shadow-lg border border-slate-800 animate-slide-up" id="ai-draft-card">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                      <div>
                        <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Sparkles className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" />
                          <span>Gemini Diagnostics Compiled</span>
                        </div>
                        <h4 className="font-sans font-black text-white text-base mt-1.5">Diagnosed Incident Draft</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono block text-slate-500">Confidence Match</span>
                        <span className="text-xs font-mono font-bold text-blue-400">{(analyzedDraft.confidenceScore * 100).toFixed(0)}% Accurate</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-0.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Detected Category</span>
                        <span className="font-bold text-white block">{analyzedDraft.category}</span>
                      </div>
                      <div className="space-y-0.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Severity Assessment</span>
                        <span className={`font-bold block ${
                          analyzedDraft.severity === "Critical" ? "text-red-400" : analyzedDraft.severity === "High" ? "text-amber-400" : "text-blue-400"
                        }`}>{analyzedDraft.severity} (Score: {analyzedDraft.severityScore}/100)</span>
                      </div>
                      <div className="space-y-0.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Division Routing Target</span>
                        <span className="font-bold text-white block">{analyzedDraft.assignedDepartment}</span>
                      </div>
                      <div className="space-y-0.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Urgent Citizen Warn</span>
                        <span className="font-medium text-slate-300 line-clamp-1 block">{analyzedDraft.suggestedAction}</span>
                      </div>
                    </div>

                    {/* complaint parchment simulation text */}
                    <div className="space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-800/70 font-mono text-[10.5px] leading-relaxed text-slate-300 max-h-48 overflow-y-auto">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block border-b border-slate-900 pb-1.5 flex items-center space-x-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Automated Complaint Document</span>
                      </span>
                      <p className="whitespace-pre-line text-xs pt-1.5">{analyzedDraft.complaintText}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={handlePostTicket}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5"
                        id="save-report-submission-btn"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Approve & Post Civic Ticket</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* TAB 4: ISSUE DETAILS PAGE */}
        {activeTab === "details" && (() => {
          const issue = issues.find((i) => i.id === selectedIssueId);
          if (!issue) {
            return (
              <div className="text-center py-12 max-w-sm mx-auto space-y-4">
                <p className="text-slate-400 text-xs italic">We could not locate this complaint file in the database state.</p>
                <button onClick={() => setActiveTab("dashboard")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold font-sans">Browse other reports</button>
              </div>
            );
          }

          const isCritical = issue.status === "Critical";

          return (
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in" id="ticket-inspection-view">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">File ID: #{issue.id}</span>
                    <span className={`text-[10px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                      issue.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">{issue.category}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    id="return-historical-ledger"
                  >
                    Historical List
                  </button>
                </div>
              </div>

              {/* Main Info Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual Evidence Block */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-3">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">Visual Metadata</span>
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img
                        src={issue.photoUrl}
                        alt={issue.category}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-500 space-y-1 pt-1 border-t border-slate-50">
                      <p>📍 {issue.locationName}</p>
                      <p>🧬 Match: {(issue.confidenceScore * 100).toFixed(0)}% confident</p>
                      <p>🌡️ Severity Score: {issue.severityScore}/100</p>
                    </div>
                  </div>
                </div>

                {/* AI Document & timeline columns */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Visual Timeline and milestones */}
                  <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
                    <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Resolution Lifecycle Milestones</span>
                    </h4>

                    {/* Timeline representation */}
                    <div className="relative pl-6 space-y-6 border-l border-slate-100 mt-2 font-sans" id="incident-milestone-timeline">
                      
                      {/* STEP 1: Submission */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[7px]" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">Civic Alert Recorded in Database</span>
                          <span className="text-[10.5px] font-medium text-slate-500 block">
                            Filed beautifully by citizen {issue.reporterName}. Gemini Vision routed incident category metrics to the {issue.assignedDepartment} division.
                          </span>
                          <span className="text-[9.5px] font-mono font-bold text-slate-400 block">{new Date(issue.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* STEP 2: In Progress */}
                      <div className="relative">
                        <div className={`absolute -left-[30px] top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-white text-[7px] ${
                          issue.status === "In Progress" || issue.status === "Resolved" ? "bg-amber-500 animate-pulse" : "bg-slate-200"
                        }`} />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">Municipal Work Order Allocated</span>
                          <span className="text-[10.5px] font-medium text-slate-500 block">
                            Incident assigned to {issue.assignedDepartment} supervisor grid. Logistics loading.
                          </span>
                          {issue.status !== "Pending" && (
                            <span className="text-[9.5px] font-mono font-bold text-slate-400 block">Active Status: {issue.status}</span>
                          )}
                        </div>
                      </div>

                      {/* STEP 3: Resolved */}
                      <div className="relative">
                        <div className={`absolute -left-[30px] top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-white text-[7px] ${
                          issue.status === "Resolved" ? "bg-emerald-500" : "bg-slate-200"
                        }`} />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">Civilian Resolution Completed</span>
                          {issue.status === "Resolved" ? (
                            <div className="space-y-1 mt-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                              <p className="text-[11.5px] font-bold text-emerald-800">Officer resolution notes:</p>
                              <p className="text-[11px] text-slate-600 font-medium italic">“{issue.resolutionNotes || "No specific closure summary added by clerk."}”</p>
                              <span className="text-[9.5px] font-mono font-bold text-emerald-600 block">{new Date(issue.resolutionDate || "").toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-[10.5px] font-medium text-slate-400 block">Awaiting field engineering site clearance...</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* AI Generated Legal Document mock parchment */}
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                    <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center space-x-1.5 pb-2 border-b border-slate-50">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Heuristic Complaint Structure</span>
                    </h4>
                    <div className="p-4 bg-radial bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs leading-relaxed text-slate-700 max-h-60 overflow-y-auto whitespace-pre-line">
                      {issue.complaintText}
                    </div>
                  </div>

                  {/* Suggested action warnings */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-800 text-xs font-bold">
                      <Sparkles className="h-4 w-4" />
                      <span>Gemini AI Safety Suggestion</span>
                    </div>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      {issue.suggestedAction}
                    </p>
                  </div>

                  {/* OFFICER RAIL CONTROLS */}
                  {(currentRole === "officer" || currentRole === "admin") && (
                    <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-lg border border-slate-850" id="officer-interaction-rail">
                      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                        <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-sans font-black text-white text-sm">Municipal Officer Command Desk</h4>
                          <p className="text-[10px] text-slate-400 font-medium">As an authorized '{currentRole}', update the resolution lifecycle status.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Officer Inspection Notes</label>
                          <textarea
                            rows={2}
                            value={officerNotes}
                            onChange={(e) => setOfficerNotes(e.target.value)}
                            placeholder="Type progress update or closing resolution notes clearly for citizens..."
                            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            id="officer-notes-textarea"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "In Progress")}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center space-x-1"
                            id="action-progress-btn"
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span>Dispatch: Mark "In Progress"</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "Resolved")}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center space-x-1"
                            id="action-resolve-btn"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                            <span>Approve & Mark "Resolved"</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 5: CITY ANALYTICS DASHBOARD */}
        {activeTab === "analytics" && (
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8" id="analytics-view">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-mono font-bold px-2 rounded-full uppercase">BI Portal</span>
                <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900 mt-1">Smart Infrastructure Diagnostics</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Synthesized overview metrics displaying infrastructure loads, hotspot clusters, and SLA response rates.</p>
              </div>
              <button
                onClick={() => setActiveTab("report")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100"
                id="analytics-report-trigger-btn"
              >
                File New Alert
              </button>
            </div>

            {/* Render the Custom charts engine */}
            <CityCharts issues={issues} departments={departments} />
          </div>
        )}

        {/* TAB 6: ADMIN DASHBOARD */}
        {activeTab === "admin" && (
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in" id="admin-view">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="p-1 px-2 text-[10px] bg-red-50 text-red-700 border border-red-100 rounded-lg uppercase font-mono font-black">Authorized</span>
                <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900 mt-1">System Administration Deck</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Verify system parameters, audit transaction registries, and manage sandbox simulation values.</p>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <button
                  onClick={handleResetSystem}
                  className="px-3.5 py-1.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-xl transition-all flex items-center space-x-1"
                  id="reset-sandbox-btn"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Seeding Reset</span>
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Log registry audits */}
              <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
                  <Activity className="h-5 w-5 text-red-500" />
                  <h4 className="font-sans font-bold text-slate-800 text-sm">System Audit Records Log</h4>
                </div>

                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1" id="audit-log-scroller">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 border border-slate-100 rounded-2xl hover:bg-slate-55/20 transition-colors flex items-start space-x-3.5" id={`audit-log-item-${log.id}`}>
                      <div className="p-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl font-mono text-xs font-bold">
                        LOG
                      </div>
                      <div className="space-y-1 flex-grow">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 font-sans">{log.type}</span>
                          <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed leading-relaxed">{log.description}</p>
                        {log.issueId && log.issueId !== "system" && (
                          <span
                            onClick={() => {
                              setSelectedIssueId(log.issueId);
                              setActiveTab("details");
                            }}
                            className="text-[10.5px] font-mono font-bold text-blue-600 hover:underline cursor-pointer block mt-1"
                          >
                            Inspect Linked Ticket: #{log.issueId} →
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Division lists */}
              <div className="md:col-span-1 space-y-6">
                
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4" id="municipal-staffing-box">
                  <div className="pb-2 border-b border-slate-50">
                    <h4 className="font-sans font-bold text-slate-800 text-sm">Staff Contact Index (SLA)</h4>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Direct supervisor alerts and emails cataloged for local system routing.</p>
                  </div>

                  <div className="space-y-3.5">
                    {departments.map((dept) => (
                      <div key={dept.id} className="space-y-1 text-xs font-sans">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{dept.name}</span>
                          <span className="text-[10.5px] font-mono text-slate-400">Head: {dept.head}</span>
                        </div>
                        <p className="text-[10px] font-mono text-blue-500">{dept.email}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated alert warning desk */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-mono font-black text-orange-700 uppercase tracking-widest block">Sandbox Testing Guide</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">To test the administrative workflow, change your role to **"Officer Irina"** or **"City Admin Marcus"** using the dropdown at the top-right. This triggers custom action tabs in the ticket inspection details view.</p>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Persistent global Footer */}
      <Footer />
    </div>
  );
}
