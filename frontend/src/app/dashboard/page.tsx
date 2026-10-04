"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Plus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
} from "lucide-react";

import {
  getCurrentUser,
  User,
} from "@/lib/auth";
import { getDashboardStats, DashboardStats } from "@/lib/dashboard";
import AppShell from "@/components/layout/AppShell";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import RecentAnalysis from "@/components/dashboard/RecentAnalysis";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

    const [stats, setStats] = useState<DashboardStats | null>(null);
const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function checkAuthentication() {
     

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch {
        

        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, [router]);


  useEffect(() => {
  async function loadStats() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    } finally {
      setLoadingStats(false);
    }
  }

  loadStats();
}, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="icon-tile mx-auto flex h-12 w-12 border border-slate-200 bg-slate-50 text-slate-400">
            <Sparkles
              size={22}
              className="animate-pulse"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-900">
            Loading your workspace...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Preparing your career insights
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        <WelcomeHeader email={user.email} />

        {/* Hero */}
        <section className="panel relative mb-8 overflow-hidden">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
                <Sparkles size={22} />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Resume intelligence
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Turn your resume into a
                <span className="text-slate-900">
                  {" "}career advantage.
                </span>
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Compare your resume with a real job
                description and get AI-powered insights
                into skills, experience, requirements,
                strengths and areas for improvement.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    router.push("/resumes")
                  }
                  className="btn-primary group px-5 py-3 hover:-translate-y-0.5"
                >
                  <Upload size={17} />

                  Upload resume

                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>

                <button
                  onClick={() =>
                    router.push("/jobs")
                  }
                  className="btn-ghost px-5 py-3"
                >
                  <Plus size={17} />

                  Add job description
                </button>
              </div>
            </div>

            {/* Feature pills */}
            <div className="relative mt-9 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3">
              <Feature
                icon={Brain}
                title="AI-powered"
                description="Semantic resume analysis"
              />

              <Feature
                icon={Zap}
                title="Fast insights"
                description="Async background processing"
              />

              <Feature
                icon={ShieldCheck}
                title="Evidence-based"
                description="Grounded in your resume"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Resumes"
            value={loadingStats
              ? "..."
              : String(stats?.resume_count ?? 0)} description={"Uploaded documents"} type={"resume"}          />

          <StatCard
            title="Jobs"
            value={loadingStats
              ? "..."
              : String(stats?.job_count ?? 0)} description={"Target positions"} type={"job"}          />

          <StatCard
            title="Analyses"
            value={loadingStats
              ? "..."
              : String(stats?.analysis_count ?? 0)} description={"Reports generated"} type={"analysis"}          />

          <StatCard
            title="Average Score"
            value={loadingStats
              ? "..."
              : `${stats?.average_score ?? 0}`} description={"Across all analyses"} type={"score"}          />
        </section>

        {/* Recent */}
        <section className="mt-8">
          <RecentAnalysis
  analyses={stats?.recent_analyses ?? []}
  onViewAll={() => router.push("/analyses")}
  onOpenAnalysis={(id) =>
    router.push(`/analyses/${id}`)
  }
/>
        </section>
      </div>
    </AppShell>
  );
}

interface FeatureProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function Feature({
  icon: Icon,
  title,
  description,
}: FeatureProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}