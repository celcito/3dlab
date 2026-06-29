/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Brush, Cuboid, BoxSelect, Calculator, Image as ImageIcon } from "lucide-react";
import PaintMixer from "./pages/PaintMixer";
import AiFigures from "./pages/AiFigures";
import Viewer3D from "./pages/Viewer3D";
import PriceCalculator from "./pages/PriceCalculator";
import ImageTo3D from "./pages/ImageTo3D";

function NavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      title={label}
      className={`w-12 h-12 flex items-center justify-center border-2 transition-colors ${
        isActive 
          ? "border-white text-white bg-white/10" 
          : "border-transparent text-zinc-500 hover:border-zinc-700 hover:text-white"
      }`}
    >
      <Icon className="w-5 h-5" />
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden">
      {/* NAVIGATION RAIL */}
      <nav className="w-[80px] bg-[#111] border-r border-[#222] flex flex-col items-center py-8 gap-10 shrink-0">
        <div className="text-2xl font-black tracking-tighter border-2 border-white w-12 h-12 flex items-center justify-center shrink-0">
          V
        </div>
        <div className="flex flex-col gap-4">
          <NavItem to="/" icon={Brush} label="Paint Mixer" />
          <NavItem to="/ai-figures" icon={Cuboid} label="AI Figures" />
          <NavItem to="/viewer" icon={BoxSelect} label="3D Viewer" />
          <NavItem to="/price-calculator" icon={Calculator} label="Price Calculator" />
          <NavItem to="/image-to-3d" icon={ImageIcon} label="Image to 3D" />
        </div>
      </nav>
      
      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#080808]">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PaintMixer />} />
          <Route path="/ai-figures" element={<AiFigures />} />
          <Route path="/viewer" element={<Viewer3D />} />
          <Route path="/price-calculator" element={<PriceCalculator />} />
          <Route path="/image-to-3d" element={<ImageTo3D />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
