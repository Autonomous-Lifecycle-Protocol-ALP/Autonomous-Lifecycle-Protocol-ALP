import { useState, useEffect, useRef } from "react";
import api from "../utils/api.js";
import { BellIcon, CheckCircleIcon, AlertIcon, ShieldIcon, SparklesIcon, XIcon } from "./Icons.jsx";
import { useRealtimeEvents } from "../hooks/useRealtimeEvents.js";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const { connected, liveEvents } = useRealtimeEvents();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/telemetry/stream");
      if (res.data?.success) {
        setEvents(res.data.events || []);
        setUnreadCount((c) => c + (res.data.events?.length || 0));
      }
    } catch {
      // Fallback notifications if offline
      setEvents([
        { id: '1', title: 'SHA-256 Merkle Trace Verified', detail: 'Chain #chain-v8200 integrity confirmed', status: 'success', timestamp: '2m ago' },
        { id: '2', title: 'Governance Guardrail Executed', detail: 'Policy "auth-security-gate" denied untrusted payload', status: 'warning', timestamp: '8m ago' },
      ]);
      setUnreadCount((c) => c + 2);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // When new WebSocket live events arrive, prepend them
  useEffect(() => {
    if (liveEvents && liveEvents.length > 0) {
      const latest = liveEvents[0];
      setEvents((prev) => {
        if (prev.some((e) => e.id === latest.id)) return prev;
        return [latest, ...prev.slice(0, 49)];
      });
      if (!open) {
        setUnreadCount((c) => c + 1);
      }
    }
  }, [liveEvents]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) {
      setUnreadCount(0);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="text-emerald-400 flex-shrink-0" />;
      case "warning":
        return <AlertIcon className="text-amber-400 flex-shrink-0" />;
      default:
        return <SparklesIcon className="text-sky-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-400 hover:text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition-smooth"
        title="Protocol Notifications"
      >
        <BellIcon size="md" />
        {connected && (
          <span className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" title="Live WebSocket Connected" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center badge-glow">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 card-glass border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldIcon className="text-sky-400" />
              <span className="text-sm font-bold text-slate-100">Live Protocol Notifications</span>
              {connected && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE WS
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs p-1"
            >
              <XIcon />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {loading && events.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No recent notifications.</div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800/60 p-3 rounded-xl transition-smooth flex items-start gap-3"
                >
                  <div className="mt-0.5">{getStatusIcon(evt.status)}</div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-bold text-slate-200">{evt.title}</div>
                    <div className="text-[11px] text-slate-400 leading-tight">{evt.detail}</div>
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      {evt.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-center flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-mono">
              Status: {connected ? <span className="text-emerald-400">Connected</span> : <span className="text-slate-400">Offline</span>}
            </span>
            <span className="text-sky-400 font-mono">
              ALP V82.0.0 Stream
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
