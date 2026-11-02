"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileCheck2, FileText, Sparkles, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResumeUploadResponse, uploadResume } from "@/lib/resume";

interface ResumeUploaderProps {
  onUploaded?: (resume: ResumeUploadResponse) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export default function ResumeUploader({ onUploaded }: ResumeUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<ResumeUploadResponse | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function processFile(selectedFile: File) {
    if (uploading) return;
    setError("");
    setResume(null);
    setFile(selectedFile);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Only PDF and DOCX files are supported.");
      setFile(null);
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 10 MB.");
      setFile(null);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadResume(selectedFile);
      setResume(result);
      onUploaded?.(result);
    } catch (err) {
      setFile(null);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) void processFile(selected);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const selected = event.dataTransfer.files?.[0];
    if (selected) void processFile(selected);
  }

  function reset() {
    setFile(null);
    setResume(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (resume) {
    return (
      <div className="panel overflow-hidden">
        <div className="bg-emerald-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-600">
              <FileCheck2 size={25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> Upload complete
              </p>
              <p className="mt-1 truncate font-semibold text-slate-900">{resume.filename}</p>
              <p className="mt-1 text-xs text-slate-500">
                {resume.text_length.toLocaleString()} characters extracted from your resume.
              </p>
            </div>
            <button onClick={reset} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Upload another resume">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
          <button onClick={() => router.push("/resumes")} className="btn-ghost">View resumes</button>
          <button onClick={() => router.push(`/analyses/new?resumeId=${resume.resume_id}`)} className="btn-primary">
            Continue to analysis <Sparkles size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
          dragging ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
        } ${uploading ? "cursor-wait opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <UploadCloud size={28} />
        </div>
        <h3 className="mt-5 text-lg font-bold text-slate-900">
          {uploading ? "Uploading your resume..." : "Drop your resume here"}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {uploading ? "Please wait while your file is processed." : "or browse your files"}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <span className="chip">PDF</span>
          <span className="chip">DOCX</span>
          <span className="chip">Max 10 MB</span>
        </div>
        {file && <p className="mt-4 text-xs text-slate-500">Selected: {file.name}</p>}
      </div>
      {error && (
        <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <FileText size={14} /> Files are uploaded to your authenticated account.
      </p>
    </div>
  );
}
