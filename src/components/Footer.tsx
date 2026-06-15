import React from "react";
import { Shield, Mail, Phone, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-350 border-t border-slate-800 font-sans mt-auto" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand and Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                CITYPULSE AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
              CityPulse AI is a civic infrastructure platform bridging the gap between local citizen vigilance and municipal action. Empowered by server-side Gemini Vision AI, reports are routed, rated, and resolved in real time.
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Designed for Apple-level simplicity, Pinterest elegance, and Airbnb clarity.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
              Departments
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
              <li className="hover:text-blue-400 transition-colors cursor-pointer">Roads & Sidewalks</li>
              <li className="hover:text-blue-400 transition-colors cursor-pointer">Water Supply Grid</li>
              <li className="hover:text-blue-400 transition-colors cursor-pointer">Power & Electricity</li>
              <li className="hover:text-blue-400 transition-colors cursor-pointer">Sanitation & Recycling</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
              Contact Portal
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>support@citypulse-ai.gov</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>+1 (800) 555-0199</span>
              </li>
              <li className="text-[11px] text-slate-500 font-serif italic">
                “Turning static reports into direct, local municipal action, saving millions in damages.”
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium">
          <p>© 2026 CityPulse AI - Smart Municipal Solutions. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-4 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>by Senior Smart City Architects</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
