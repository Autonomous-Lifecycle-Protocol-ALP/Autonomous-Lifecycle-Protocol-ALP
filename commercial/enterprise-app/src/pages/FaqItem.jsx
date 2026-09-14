import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";

export default function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{item.q}</span>
        <LuChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-5 pr-8 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}
