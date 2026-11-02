"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, RotateCcw } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { CandidateApplication, getApplicationHistory, getMyApplications, withdrawApplication } from "@/lib/applications";

export default function ApplicationsPage() {
  const [items, setItems] = useState<CandidateApplication[]>([]);
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setItems(await getMyApplications()); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load applications."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function withdraw(id: string) {
    setBusy(id); setError(""); setNotice("");
    try { await withdrawApplication(id); setNotice("Application withdrawn."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not withdraw application."); }
    finally { setBusy(""); }
  }

  async function toggleHistory(id: string) {
    if (history[id]) { setHistory((old) => { const copy = { ...old }; delete copy[id]; return copy; }); return; }
    try {
      const rows = await getApplicationHistory(id);
      setHistory((old) => ({ ...old, [id]: rows.map((row) => `${row.old_status ?? "Created"} → ${row.new_status} · ${(row.created_at || row.changed_at ? new Date(row.created_at || row.changed_at || "").toLocaleString() : "date unavailable")}`) }));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load application history."); }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-900">My applications</h1><p className="mt-2 text-sm text-slate-500">Track applications submitted to published marketplace jobs.</p></div><button onClick={() => void load()} className="btn-ghost"><RefreshCw size={15} /> Refresh</button></div>
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
        {loading ? <ListSkeleton rows={4} /> :
          !items.length ? <div className="panel p-10 text-center text-sm text-slate-500">You have not applied to any marketplace jobs yet. <a href="/jobs" className="font-semibold text-violet-600">Browse jobs</a>.</div> :
          <div className="space-y-3">{items.map((item) => <article key={item.id} className="panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-semibold text-slate-900">{item.job_title}</h2><p className="mt-1 text-sm text-slate-500">{item.company_name}</p><p className="mt-2 text-xs text-slate-400">Applied {new Date(item.created_at).toLocaleString()}</p><span className="mt-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">{item.status}</span></div>
              <div className="flex flex-wrap gap-2"><button onClick={() => void toggleHistory(item.id)} className="btn-ghost"><History size={15} /> History</button>{!["withdrawn", "rejected", "hired", "selected"].includes(item.status.toLowerCase()) && <button onClick={() => void withdraw(item.id)} disabled={busy === item.id} className="btn-ghost"><RotateCcw size={15} /> {busy === item.id ? "Withdrawing..." : "Withdraw"}</button>}</div>
            </div>
            {item.cover_letter && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{item.cover_letter}</p>}
            {history[item.id] && <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">{history[item.id].map((line, i) => <li key={i}>{line}</li>)}</ul>}
          </article>)}</div>
        }
      </div>
    </AppShell>
  );
}
