"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileUser, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { CardGridSkeleton, PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getCurrentUser, UserRole } from "@/lib/auth";
import { CandidateProfile, deleteCandidate, extractCandidateFromResume, getCandidates } from "@/lib/candidates";
import { getResumes, ResumeResponse } from "@/lib/resume";

function CandidatesContent() {
  const searchParams = useSearchParams();
  const requestedResumeId = searchParams.get("resumeId") ?? "";
  const [items, setItems] = useState<CandidateProfile[]>([]);
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [resumeId, setResumeId] = useState(requestedResumeId);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const autoExtractedResume = useRef("");

  const load = useCallback(async () => {
    if (role !== "recruiter") return;
    setLoading(true);
    setError("");
    try {
      const [profiles, files] = await Promise.all([getCandidates(search), getResumes()]);
      setItems(profiles);
      setResumes(files);
      setResumeId((current) => current || requestedResumeId || files[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load candidate profiles.");
    } finally {
      setLoading(false);
    }
  }, [role, search, requestedResumeId]);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (!active) return;
        setRole(user.role);
        if (user.role !== "recruiter") {
          setLoading(false);
          setError("Candidate profile tools are available to recruiter accounts.");
        }
      })
      .catch(() => { if (active) { setRole(null); setLoading(false); setError("Please sign in with a recruiter account to manage candidate profiles."); } });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (role === "recruiter") void load(); }, [load, role]);

  const extract = useCallback(async (selectedResumeId = resumeId) => {
    if (!selectedResumeId) {
      setError("Upload and select a resume first.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const candidate = await extractCandidateFromResume(selectedResumeId);
      setNotice(`Candidate profile extracted for ${candidate.full_name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile extraction failed.");
    } finally {
      setBusy(false);
    }
  }, [load, resumeId]);

  useEffect(() => {
    if (role !== "recruiter" || !requestedResumeId || autoExtractedResume.current === requestedResumeId) return;
    autoExtractedResume.current = requestedResumeId;
    setResumeId(requestedResumeId);
    void extract(requestedResumeId);
  }, [extract, requestedResumeId, role]);

  async function remove(id: string) {
    try {
      await deleteCandidate(id);
      setItems((old) => old.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete candidate.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-7">
          <div className="icon-tile flex h-12 w-12"><FileUser size={22} /></div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Candidate profiles</h1>
          <p className="mt-2 text-sm text-slate-500">Extract a profile from a resume and manage your candidate records.</p>
        </div>

        {role === "recruiter" && <section className="panel mb-6 p-5">
          <h2 className="font-semibold text-slate-900">Extract from resume</h2>
          <p className="mt-1 text-sm text-slate-500">Profile details are extracted from the selected resume. Existing profiles linked to it are updated.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="field h-11 flex-1 px-3 text-sm">
              <option value="">Select a resume</option>
              {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.original_filename}</option>)}
            </select>
            <button onClick={() => void extract()} disabled={busy || !resumeId} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {busy ? "Extracting profile..." : "Extract profile"}
            </button>
          </div>
        </section>}

        {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
        {role === "recruiter" && <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or current title..." className="field h-11 px-3 text-sm" />
          <button onClick={() => void load()} className="btn-ghost" disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>}
        {loading ? <CardGridSkeleton cards={4} /> : role === "recruiter" && !items.length ?
          <div className="panel p-10 text-center text-sm text-slate-500">No candidate profiles found.</div> :
          role === "recruiter" ? <div className="grid gap-4 md:grid-cols-2">{items.map((candidate) => <article key={candidate.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{candidate.full_name}</h2><p className="mt-1 text-sm text-slate-500">{candidate.current_title || "Title not provided"}</p></div><button onClick={() => void remove(candidate.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete candidate"><Trash2 size={16} /></button></div>
            {candidate.email && <p className="mt-3 text-sm text-slate-600">{candidate.email}</p>}
            <p className="mt-2 text-xs text-slate-500">Experience: {candidate.experience_years ?? "Not specified"} years</p>
            {candidate.skills?.length ? <div className="mt-4 flex flex-wrap gap-2">{candidate.skills.map((skill) => <span key={skill} className="chip">{skill}</span>)}</div> : null}
            <p className="mt-4 truncate text-[11px] text-slate-400">Profile ID: {candidate.id}</p>
          </article>)}</div> : null}
      </div>
    </AppShell>
  );
}

export default function CandidatesPage() {
  return <Suspense fallback={<AppShell><PageSkeleton /></AppShell>}><CandidatesContent /></Suspense>;
}
