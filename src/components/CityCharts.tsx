import React from "react";
import { IssueTicket, DepartmentInfo } from "../types";
import { BarChart3, TrendingUp, Sparkles, Clock, AlertTriangle, ShieldCheck, ThumbsUp } from "lucide-react";

interface CityChartsProps {
  issues: IssueTicket[];
  departments: DepartmentInfo[];
}

export default function CityCharts({ issues, departments }: CityChartsProps) {
  // 1. Calculate Statistics Counts
  const totalIssuesCount = issues.length;
  const criticalCount = issues.filter((i) => i.status === "Critical").length;
  const inProgressCount = issues.filter((i) => i.status === "In Progress").length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;
  const pendingCount = issues.filter((i) => i.status === "Pending").length;

  const resolutionRate = totalIssuesCount > 0 ? Math.round((resolvedCount / totalIssuesCount) * 100) : 0;

  // 2. Count Issues by Category
  const categoryCounts = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalIssuesCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Hotspots representation (Simulated based on issue location names)
  const hotspotAreas = [
    { zone: "District 6 (Downtown Center)", count: issues.filter((i) => i.locationName.includes("Market") || i.locationName.includes("Bryant")).length + 2, risk: "High", color: "bg-red-50 text-red-700 hover:bg-red-100" },
    { zone: "District 12 (Embarcadero Waterfront)", count: issues.filter((i) => i.locationName.includes("Embarcadero")).length + 1, risk: "Medium", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { zone: "District 8 (Dolores Reserve Sector)", count: issues.filter((i) => i.locationName.includes("Park") || i.locationName.includes("Dolores")).length, risk: "Low", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
    { zone: "District 5 (Haight-Ashbury Outer Grid)", count: issues.filter((i) => i.locationName.includes("Haight")).length, risk: "Medium", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  ].sort((a, b) => b.count - a.count);

  // 4. Monthly Trend Data (Simulated for visual layout)
  const monthlyTimeline = [
    { month: "Jan", count: 24 },
    { month: "Feb", count: 32 },
    { month: "Mar", count: 28 },
    { month: "Apr", count: 41 },
    { month: "May", count: 35 },
    { month: "Jun (Current)", count: totalIssuesCount },
  ];

  // SVG coordinate calculations for monthly trend Sparkline
  const sparkWidth = 450;
  const sparkHeight = 120;
  const padding = 20;

  const points = monthlyTimeline
    .map((item, idx) => {
      const maxCount = 50;
      const x = padding + (idx / (monthlyTimeline.length - 1)) * (sparkWidth - padding * 2);
      const y = sparkHeight - padding - (item.count / maxCount) * (sparkHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-6" id="city-analytics-root">
      
      {/* Upper Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-ribbon">
        
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:scale-102 transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Total Incidents</span>
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight block">{totalIssuesCount}</span>
            <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +14.5% Since Last Week
            </span>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:scale-102 transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Critical Threats</span>
            <span className="text-3xl font-extrabold text-red-600 tracking-tight block">{criticalCount}</span>
            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 animate-bounce" /> Level 2 dispatchers active
            </span>
          </div>
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:scale-102 transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Resolution Index</span>
            <span className="text-3xl font-extrabold text-[#10b981] tracking-tight block">{resolutionRate}%</span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Target standard metric 90%
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:scale-102 transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Active Pipeline</span>
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight block">{inProgressCount + pendingCount}</span>
            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
              <Clock className="h-3 w-3" /> Average close: 32 hours
            </span>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-bento-grid">
        
        {/* Chart A: Issues by Category */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span>Category Incidence Ratio</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">
              Visualizes which public utility classes generate the highest feedback volumes.
            </p>
          </div>

          <div className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No category data compiled yet.</p>
            ) : (
              categoryData.map((item, idx) => (
                <div key={item.name} className="space-y-1.5" id={`category-chart-item-${idx}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-semibold text-slate-700">{item.name}</span>
                    <div className="flex items-center space-x-2 font-mono font-bold text-slate-500 text-[11px]">
                      <span>{item.count} Reports</span>
                      <span className="text-blue-600">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart B: Historical Trends Timeline */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span>Monthly Registration Flow</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">
              Displays monthly tracking velocity across civic diagnostic cycles.
            </p>
          </div>

          <div className="flex items-center justify-center p-2 rounded-2xl bg-slate-50/40 relative">
            <svg
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              className="w-full h-auto"
              id="trend-sparkline-svg"
            >
              <g opacity="0.3">
                <line x1="10" y1="20" x2={sparkWidth - 10} y2="20" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="10" y1="60" x2={sparkWidth - 10} y2="60" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="10" y1="100" x2={sparkWidth - 10} y2="100" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3" />
              </g>

              {/* Sparkline path */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                style={{
                  filter: "drop-shadow(0px 4px 6px rgba(37, 99, 235, 0.2))",
                }}
              />

              {/* Plot joints */}
              {monthlyTimeline.map((item, idx) => {
                const maxCount = 50;
                const x = padding + (idx / (monthlyTimeline.length - 1)) * (sparkWidth - padding * 2);
                const y = sparkHeight - padding - (item.count / maxCount) * (sparkHeight - padding * 2);

                return (
                  <g key={idx} className="group">
                    <circle cx={x} cy={y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={x} y={y - 10} fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {item.count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 px-4">
            {monthlyTimeline.map((item) => (
              <span key={item.month}>{item.month}</span>
            ))}
          </div>
        </div>

      </div>

      {/* Hotspots & Division SLA metrics row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="hotspots-and-sla">
        
        {/* Hotspots Panel */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">
              Geo-Infrastructure Incident Hotspots
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Calculates structural load hotspots across registered local neighborhood sectors.
            </p>
          </div>

          <div className="space-y-2.5">
            {hotspotAreas.map((area, idx) => (
              <div
                key={area.zone}
                className={`p-3.5 border border-slate-100 rounded-2xl flex justify-between items-center transition-all ${area.color}`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold font-sans block">{area.zone}</span>
                  <span className="text-[10px] font-mono font-semibold opacity-75">
                    Density Level: {area.risk} Priority
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold font-mono block">{area.count} Cases</span>
                  <span className="text-[9px] font-semibold opacity-75 block">Active Alerts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments SLA SLA statistics */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">
              Municipal Divisions Processing Speed (SLA)
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Tracks the speed of closing tasks by comparing assigned to resolved ticket volumes.
            </p>
          </div>

          <div className="space-y-3.5">
            {departments.map((dept, idx) => {
              const solvePercent = dept.issueCount > 0 ? Math.round((dept.resolvedCount / dept.issueCount) * 100) : 0;
              return (
                <div key={dept.id} className="space-y-1.5" id={`analytics-dept-item-${idx}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-bold text-slate-700">{dept.name}</span>
                    <span className="font-mono font-extrabold text-blue-600 text-[11px]">
                      {dept.resolvedCount}/{dept.issueCount} Resolved ({solvePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        solvePercent >= 75 ? "bg-emerald-500" : solvePercent >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${solvePercent === 0 && dept.issueCount > 0 ? 10 : Math.max(solvePercent, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
