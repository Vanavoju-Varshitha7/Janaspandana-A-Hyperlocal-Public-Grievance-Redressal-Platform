import React, { useState } from "react";
import { Building2, TrendingUp, CheckCircle, Clock, AlertTriangle, HelpCircle, Award, Landmark } from "lucide-react";

interface AnalyticsProps {
  signals: any[];
  theme?: string;
}

export default function Analytics({ signals, theme = "dark" }: AnalyticsProps) {
  // Compute real statistics from signals
  const total = signals.length;
  const pending = signals.filter(s => s.lifecycle === "PENDING").length;
  const inProgress = signals.filter(s => s.lifecycle === "IN_PROGRESS").length;
  const resolved = signals.filter(s => s.lifecycle === "RESOLVED").length;
  const escalated = signals.filter(s => s.lifecycle === "ESCALATED").length;

  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const isDark = theme === "dark";

  // Dynamic theme styling helpers
  const cardClass = isDark
    ? "bg-slate-900/60 backdrop-blur border border-slate-800 shadow-xl"
    : "bg-white border border-slate-200 shadow-md";
  const textTitle = isDark ? "text-slate-200" : "text-slate-800";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const textBold = isDark ? "text-white" : "text-slate-900";
  const borderClass = isDark ? "border-slate-800" : "border-slate-200";
  const bgInner = isDark ? "bg-slate-950" : "bg-slate-50";
  const bgInnerBorder = isDark ? "border-slate-800" : "border-slate-200";
  const textLabel = isDark ? "text-slate-300" : "text-slate-700";
  const textMuted = isDark ? "text-slate-500" : "text-slate-400";

  // Departmental leaderboard static + computed data
  const departments = [
    {
      name: "Public Safety",
      resolved: 237,
      total: 279,
      rate: 85,
      budget: "₹6.0M",
      color: "bg-purple-500"
    },
    {
      name: "Traffic Control",
      resolved: 267,
      total: 303,
      rate: 88,
      budget: "₹11.4M",
      color: "bg-pink-500"
    },
    {
      name: "Disaster Management",
      resolved: 242,
      total: 303,
      rate: 80,
      budget: "₹11.0M",
      color: "bg-rose-500"
    },
    {
      name: "Water Supply Board",
      resolved: 198,
      total: 250,
      rate: 79,
      budget: "₹9.2M",
      color: "bg-blue-500"
    },
    {
      name: "Sanitation & Waste",
      resolved: 312,
      total: 410,
      rate: 76,
      budget: "₹5.4M",
      color: "bg-emerald-500"
    }
  ];

  // Donut chart calculation
  // Segments: Escalated, In Progress, Pending, Resolved
  const segments = [
    { label: "Escalated", count: escalated || 1, color: "#f43f5e", bgClass: "bg-rose-500" },
    { label: "In Progress", count: inProgress || 2, color: "#eab308", bgClass: "bg-yellow-500" },
    { label: "Pending", count: pending || 1, color: "#3b82f6", bgClass: "bg-blue-500" },
    { label: "Resolved", count: resolved || 3, color: "#10b981", bgClass: "bg-emerald-500" }
  ];

  const totalCount = segments.reduce((sum, s) => sum + s.count, 0);
  
  // Calculate circumference & dasharrays
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // Monthly velocity line data (Jan - Jun)
  const monthlyData = [
    { month: "Jan", value: 140 },
    { month: "Feb", value: 165 },
    { month: "Mar", value: 152 },
    { month: "Apr", value: 185 },
    { month: "May", value: 172 },
    { month: "Jun", value: 198 }
  ];

  // Convert monthly data into SVG points for Line and Area
  // Width 450, Height 140. Margin left 40, right 20, top 10, bottom 25
  const chartWidth = 450;
  const chartHeight = 140;
  const paddingX = 40;
  const paddingY = 20;

  const getPoints = () => {
    const minVal = 100;
    const maxVal = 220;
    const points = monthlyData.map((d, index) => {
      const x = paddingX + (index * (chartWidth - paddingX - 20)) / (monthlyData.length - 1);
      // Map value range minVal - maxVal to screen space Y (chartHeight - paddingY down to top margin)
      const ratio = (d.value - minVal) / (maxVal - minVal);
      const y = chartHeight - paddingY - ratio * (chartHeight - paddingY - 15);
      return { x, y, ...d };
    });
    return points;
  };

  const points = getPoints();
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Donut Chart and Stats card */}
      <div className={`${cardClass} flex flex-col justify-between`}>
        <div>
          <h3 className={`text-sm font-display font-semibold uppercase tracking-wider mb-1 ${textTitle}`}>
            CITY-WIDE RESOLUTION MATRIX
          </h3>
          <p className={`text-xs mb-6 ${textSub}`}>Real-time status breakdown of registered civic signals.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* SVG Donut */}
          <div className="relative w-44 h-44">
            <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
              {/* Glow filter */}
              <defs>
                <filter id="glow-donut" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="70" cy="70" r={radius} fill="transparent" stroke={isDark ? "#1e293b" : "#f1f5f9"} strokeWidth="16" />
              {segments.map((seg, index) => {
                const percent = seg.count / totalCount;
                const dashArray = `${percent * circumference} ${circumference}`;
                const dashOffset = -accumulatedPercent * circumference;
                accumulatedPercent += percent;

                const isHovered = activeSegment === seg.label;

                return (
                  <circle
                    key={seg.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? "22" : "16"}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setActiveSegment(seg.label)}
                    onMouseLeave={() => setActiveSegment(null)}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      filter: isHovered ? "url(#glow-donut)" : "none"
                    }}
                  />
                );
              })}
            </svg>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-2xl font-mono font-bold leading-none ${textBold}`}>{total}</span>
              <span className={`text-[9px] font-semibold uppercase tracking-widest mt-1 ${textMuted}`}>
                TICKETS
              </span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="flex flex-col gap-3 min-w-[140px]">
            {segments.map((seg) => {
              const percent = Math.round((seg.count / totalCount) * 100) || 0;
              const isHovered = activeSegment === seg.label;
              return (
                <div
                  key={seg.label}
                  className={`flex items-center justify-between p-2 rounded-lg transition ${
                    isHovered
                      ? (isDark ? "bg-slate-800/80 scale-105" : "bg-slate-100 scale-105")
                      : (isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50")
                  }`}
                  onMouseEnter={() => setActiveSegment(seg.label)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${seg.bgClass}`}></span>
                    <span className={`text-xs font-semibold ${textLabel}`}>{seg.label}</span>
                  </div>
                  <div className="text-right pl-3">
                    <span className={`text-xs font-mono font-bold ${textBold}`}>{seg.count}</span>
                    <span className={`text-[10px] ml-1 ${textMuted}`}>({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregate Mini Cards */}
        <div className={`grid grid-cols-4 gap-2 mt-6 pt-4 border-t ${borderClass}`}>
          <div className="text-center">
            <span className="text-[9px] font-bold text-rose-400 block uppercase">Escalated</span>
            <span className={`text-xs font-mono font-bold ${textBold}`}>{escalated}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-bold text-yellow-400 block uppercase">In-Progress</span>
            <span className={`text-xs font-mono font-bold ${textBold}`}>{inProgress}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-bold text-blue-400 block uppercase">Pending</span>
            <span className={`text-xs font-mono font-bold ${textBold}`}>{pending}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-bold text-emerald-400 block uppercase">Resolved</span>
            <span className={`text-xs font-mono font-bold ${textBold}`}>{resolved}</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className={`${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-display font-semibold uppercase tracking-wider ${textTitle}`}>
            DEPARTMENTAL EFFICIENCY LEADERBOARD
          </h3>
          <Award className="w-4 h-4 text-purple-400" />
        </div>
        <p className={`text-xs mb-6 ${textSub}`}>Resolution performance and budget efficiency comparison.</p>

        <div className="flex flex-col gap-4">
          {departments.map((dept, index) => (
            <div key={dept.name} className="group">
              <div className={`flex items-center justify-between text-xs font-semibold mb-1 ${textLabel}`}>
                <span className="flex items-center gap-1.5 truncate">
                  <span className={`text-[10px] font-mono w-5 h-5 rounded flex items-center justify-center ${
                    isDark ? "text-purple-400 bg-purple-950/50" : "text-purple-700 bg-purple-50"
                  }`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`truncate transition ${
                    isDark ? "group-hover:text-purple-300" : "group-hover:text-purple-600"
                  }`}>{dept.name}</span>
                </span>
                <span className={`font-mono flex items-center gap-2 ${textBold}`}>
                  <span>{dept.resolved} / {dept.total} resolved</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isDark ? "text-purple-400 bg-purple-950/80" : "text-purple-700 bg-purple-100"
                  }`}>
                    {dept.rate}% Success
                  </span>
                </span>
              </div>

              {/* Progress bars & budgets */}
              <div className="flex items-center gap-3">
                <div className={`flex-1 h-2 rounded-full overflow-hidden border ${bgInner} ${bgInnerBorder}`}>
                  <div
                    className={`h-full ${dept.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${dept.rate}%` }}
                  ></div>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-mono w-16 justify-end ${textMuted}`}>
                  <Landmark className="w-2.5 h-2.5" />
                  <span>{dept.budget}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Resolution Velocity (Full Width Row) */}
      <div className={`col-span-1 lg:col-span-2 ${cardClass} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className={`text-sm font-display font-semibold uppercase tracking-wider ${textTitle}`}>
              MONTHLY RESOLUTION VELOCITY
            </h3>
            <p className={`text-xs ${textSub}`}>Total verified civic signals resolved per month.</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
            isDark ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/30" : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+15.3% Monthly Increase</span>
          </div>
        </div>

        {/* Custom SVG Line Area Graph */}
        <div className="w-full mt-6">
          <svg viewBox="0 0 450 140" className="w-full h-auto overflow-visible">
            <defs>
              {/* Fill Gradient */}
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              {/* Stroke filter glow */}
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Gridlines */}
            <g stroke={isDark ? "#1e293b" : "#f1f5f9"} strokeWidth="0.5" strokeDasharray="3 3">
              <line x1={paddingX} y1="15" x2="430" y2="15" />
              <line x1={paddingX} y1="50" x2="430" y2="50" />
              <line x1={paddingX} y1="85" x2="430" y2="85" />
              <line x1={paddingX} y1="120" x2="430" y2="120" />
            </g>

            {/* Y Axis Labels */}
            <g fill={isDark ? "#475569" : "#64748b"} fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">
              <text x={paddingX - 8} y="18">200</text>
              <text x={paddingX - 8} y="53">160</text>
              <text x={paddingX - 8} y="88">120</text>
              <text x={paddingX - 8} y="123">80</text>
            </g>

            {/* Gradient Area under curve */}
            <path d={areaPath} fill="url(#areaGrad)" />

            {/* Neon Glowing Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#neon-glow)"
            />

            {/* Dot Nodes */}
            {points.map((p, i) => (
              <g key={p.month} className="group/node">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={isDark ? "#ffffff" : "#7c3aed"}
                  stroke="#a855f7"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:r-6"
                />
                {/* Value tooltip label displayed directly on line */}
                <text
                  x={p.x}
                  y={p.y - 8}
                  fill={isDark ? "#ffffff" : "#1e1b4b"}
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  className="opacity-0 group-hover/node:opacity-100 transition-opacity"
                >
                  {p.value}
                </text>
              </g>
            ))}

            {/* X Axis Labels */}
            <g fill={isDark ? "#64748b" : "#475569"} fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
              {points.map((p) => (
                <text key={p.month} x={p.x} y="136">{p.month}</text>
              ))}
            </g>
          </svg>
        </div>
      </div>

    </div>
  );
}
