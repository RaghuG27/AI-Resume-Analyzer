"use client";

import {
  BookOpen,
  ExternalLink,
  Lightbulb,
  PlayCircle,
  Brain,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { LearningPlan } from "@/lib/analysis";

interface LearningHubProps {
  learningPlan: LearningPlan | null;
  loading: boolean;
}

export default function LearningHub({
  learningPlan,
  loading,
}: LearningHubProps) {
  if (loading) {
    return (
      <section className="mt-10">
        <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />

            <span>
              Gemini is preparing your personalized
              learning plan...
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (!learningPlan) {
    return null;
  }

  if (learningPlan.topics.length === 0) {
    return (
      <section className="mt-10">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />

            <div>
              <h2 className="font-bold text-emerald-900">
                No major learning gaps identified
              </h2>

              <p className="mt-1 text-sm text-emerald-700">
                {learningPlan.overall_advice}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <BookOpen className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Personalized Learning Hub
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-100">
              Gemini identified the areas you should focus
              on based on your resume and this job description.
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-xl bg-white/10 p-4 text-sm leading-6 text-indigo-50">
          {learningPlan.overall_advice}
        </p>
      </div>

      {/* Topics */}
      <div className="mt-6 space-y-6">
        {learningPlan.topics.map((topic, topicIndex) => (
          <div
            key={`${topic.topic}-${topicIndex}`}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Topic Header */}
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      {topic.topic}
                    </h3>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {topic.reason}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    topic.priority === "high"
                      ? "bg-rose-100 text-rose-700"
                      : topic.priority === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {topic.priority} priority
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              {/* Learning Path */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-indigo-600" />

                  <h4 className="font-bold text-slate-900">
                    Learning Path
                  </h4>
                </div>

                <div className="space-y-3">
                  {topic.learning_path.map(
                    (step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                          {index + 1}
                        </div>

                        <p className="pt-1 text-sm text-slate-700">
                          {step}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* YouTube */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-rose-500" />

                  <h4 className="font-bold text-slate-900">
                    YouTube Tutorials
                  </h4>
                </div>

                <div className="space-y-3">
                  {topic.youtube_resources.map(
                    (resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-700">
                              {resource.title}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-slate-500">
                              {resource.description}
                            </p>
                          </div>

                          <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                      </a>
                    )
                  )}
                </div>
              </div>

              {/* Websites */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />

                  <h4 className="font-bold text-slate-900">
                    Websites & Documentation
                  </h4>
                </div>

                <div className="space-y-3">
                  {topic.website_resources.map(
                    (resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-700">
                              {resource.title}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-slate-500">
                              {resource.description}
                            </p>
                          </div>

                          <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                        </div>
                      </a>
                    )
                  )}
                </div>
              </div>

              {/* Interview Questions */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />

                  <h4 className="font-bold text-slate-900">
                    Interview Questions
                  </h4>
                </div>

                <div className="space-y-3">
                  {topic.interview_questions.map(
                    (question, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {index + 1}
                          </span>

                          <div>
                            <p className="text-sm font-medium leading-6 text-slate-800">
                              {question.question}
                            </p>

                            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                              {question.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}