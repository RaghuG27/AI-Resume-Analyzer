"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { getNotifications, markAllNotificationsRead, markNotificationRead, NotificationItem } from "@/lib/notifications";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setItems(await getNotifications(100, 0)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load notifications."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function markOne(id: string) {
    try { await markNotificationRead(id); setItems((old) => old.map((n) => n.id === id ? { ...n, is_read: true } : n)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not mark notification read."); }
  }

  async function markAll() {
    try { await markAllNotificationsRead(); setItems((old) => old.map((n) => ({ ...n, is_read: true }))); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not mark notifications read."); }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="icon-tile flex h-11 w-11"><Bell size={20} /></div><h1 className="mt-4 text-3xl font-bold text-slate-900">Notifications</h1><p className="mt-2 text-sm text-slate-500">Application and account updates.</p></div><div className="flex gap-2"><button onClick={() => void load()} className="btn-ghost"><RefreshCw size={15} /> Refresh</button><button onClick={() => void markAll()} className="btn-primary"><CheckCheck size={15} /> Mark all read</button></div></div>
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {loading ? <ListSkeleton rows={4} /> :
          !items.length ? <div className="panel p-10 text-center text-sm text-slate-500">You have no notifications.</div> :
          <div className="space-y-3">{items.map((item) => <article key={item.id} className={`panel flex gap-4 p-5 ${item.is_read ? "opacity-70" : "border-violet-200"}`}><div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.is_read ? "bg-slate-300" : "bg-violet-600"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-900">{item.title}</h2><span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-2 text-xs capitalize text-slate-400">{item.notification_type.replaceAll("_", " ")}</p></div>{!item.is_read && <button onClick={() => void markOne(item.id)} className="btn-ghost self-start">Mark read</button>}</article>)}</div>
        }
      </div>
    </AppShell>
  );
}
