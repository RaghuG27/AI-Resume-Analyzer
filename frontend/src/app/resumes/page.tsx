"use client";

import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ResumeUploader from "@/components/resume/ResumeUploader";

export default function ResumesPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={15} />

          Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <FileText size={22} />
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Upload your <span className="gradient-text">resume</span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Start by uploading your latest resume.
            We'll extract the relevant information and
            prepare it for AI-powered job matching.
          </p>
        </div>

        {/* Main upload card */}
        <section className="panel p-4 sm:p-6 lg:p-8">
          <ResumeUploader />
        </section>

        {/* Feature cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard
            icon={FileText}
            iconClass="bg-sky-50 text-sky-600"
            title="PDF & DOCX"
            description="Upload your resume in either supported format."
          />

          <InfoCard
            icon={ShieldCheck}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Authenticated"
            description="Your resume is linked to your account."
          />

          <InfoCard
            icon={Sparkles}
            iconClass="bg-violet-50 text-violet-600"
            title="AI ready"
            description="Your resume will be prepared for analysis."
          />
        </section>

        {/* Process */}
        <section className="panel mt-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="icon-tile flex h-10 w-10 shrink-0 border border-slate-200 bg-slate-50 text-slate-700">
              <Zap size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                What happens next?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Once your resume is uploaded, you'll
                add a job description. ResumeAI will
                then compare the requirements against
                your resume and generate detailed
                insights.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Step number="1" text="Upload resume" />

                <Arrow />

                <Step
                  number="2"
                  text="Add job"
                />

                <Arrow />

                <Step
                  number="3"
                  text="Analyze"
                />

                <Arrow />

                <Step
                  number="4"
                  text="View insights"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
}

function InfoCard({
  icon: Icon,
  iconClass,
  title,
  description,
}: InfoCardProps) {
  return (
    <div className="panel-2 card-hover p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 ${iconClass}`}
      >
        <Icon size={18} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
        {number}
      </span>

      <span className="text-xs font-medium text-slate-700">
        {text}
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <span className="hidden items-center text-slate-400 sm:flex">
      →
    </span>
  );
}