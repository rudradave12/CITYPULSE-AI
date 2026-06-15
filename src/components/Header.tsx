import React from "react";
import { Shield, Sparkles, User, MapPin, BarChart3, Settings, LogOut, CheckCircle2 } from "lucide-react";
import { UserRole } from "../types";

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
}

export default function Header({
  currentRole,
  onRoleChange,
  activeTab,
  setActiveTab,
  userName,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo and Title */}
          <div 
            onClick={() => setActiveTab("landing")}
            className="flex items-center space-x-3 cursor-pointer group"
            id="brand-logo"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-100 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <Shield className="h-5 w-5 fill-blue-100/20" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  CITYPULSE
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center space-x-0.5">
                  <Sparkles className="h-2 w-2 text-emerald-500 fill-emerald-500" />
                  <span>AI v1.4</span>
                </span>
              </div>
              <p className="text-[10.5px] font-medium text-slate-500 tracking-wide font-sans translate-y-[-1px]">
                Turning Citizen Reports Into Action
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1" id="desktop-nav">
            <button
              onClick={() => setActiveTab("landing")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                activeTab === "landing"
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              id="nav-home"
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center space-x-1 ${
                activeTab === "dashboard" || activeTab === "report" || activeTab === "details"
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              id="nav-citizen"
            >
              <MapPin className="h-4 w-4" />
              <span>Report & Browse</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center space-x-1 ${
                activeTab === "analytics"
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              id="nav-analytics"
            >
              <BarChart3 className="h-4 w-4" />
              <span>City Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center space-x-1 ${
                activeTab === "admin"
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              id="nav-admin"
            >
              <Settings className="h-4 w-4" />
              <span>Admin Portal</span>
            </button>
          </nav>

          {/* Sandbox Role Switcher Control */}
          <div className="flex items-center space-x-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 flex items-center space-x-2" id="role-panel">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Sandbox Authority</span>
                <span className="text-xs font-bold text-slate-700 capitalize flex items-center space-x-1 justify-end">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    currentRole === "admin" ? "bg-red-500 animate-pulse" : currentRole === "officer" ? "bg-amber-500 animate-pulse" : "bg-blue-500"
                  }`} />
                  <span>{currentRole} Mode</span>
                </span>
              </div>
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-slate-300 transition-colors"
                id="role-dropdown"
              >
                <option value="citizen">Citizen (Alex)</option>
                <option value="officer">Officer (Irina)</option>
                <option value="admin">City Admin (Marcus)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
