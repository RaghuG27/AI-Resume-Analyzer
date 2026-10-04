"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import {
  FileText,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Sparkles,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  uploadResume,
  ResumeResponse,
} from "@/lib/resume";

interface ResumeUploaderProps {
  onUploaded?: (resume: ResumeResponse) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ResumeUploader({
  onUploaded,
}: ResumeUploaderProps) {
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [resume, setResume] =
    useState<ResumeResponse | null>(null);

  const [dragging, setDragging] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  function validateFile(selectedFile: File) {
    console.log("Selected file:", {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return "Only PDF and DOCX files are supported.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "File size must not exceed 10 MB.";
    }

    return null;
  }

  async function processFile(selectedFile: File) {
    if (uploading) {
      return;
    }

    console.log("Starting upload:", selectedFile.name);

    setError("");
    setResume(null);
    setFile(selectedFile);
    setUploading(true);

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      console.error(
        "File validation failed:",
        validationError
      );

      setError(validationError);
      setFile(null);
      setUploading(false);
      return;
    }

    try {
      console.log("Calling uploadResume()...");

      const result = await uploadResume(
        selectedFile
      );

      console.log(
        "Upload successful:",
        result
      );

      setResume(result);

      onUploaded?.(result);
    } catch (error) {
      console.error(
        "Resume upload failed:",
        error
      );

      setFile(null);

      setError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    console.log(
      "File input changed:",
      selectedFile
    );

    if (selectedFile) {
      processFile(selectedFile);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    console.log(
      "Dropped file:",
      droppedFile
    );

    if (droppedFile) {
      processFile(droppedFile);
    }
  }

  function removeFile() {
    setFile(null);
    setResume(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleContinue() {
    if (!resume) {
      return;
    }

    console.log(
      "Continuing with resume:",
      resume.id
    );

    router.push(
      `/analyses/new?resumeId=${resume.id}`
    );
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
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={17}
                  className="text-emerald-600"
                />

                <p className="text-sm font-semibold text-emerald-600">
                  Upload complete
                </p>
              </div>

              <p className="mt-1 truncate text-base font-semibold text-slate-900">
                {resume.original_filename}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Your resume is ready for analysis.
              </p>
            </div>

            <button
              type="button"
              onClick={removeFile}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Remove resume"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles
              size={14}
              className="text-slate-400"
            />

            Next: add a job description
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="btn-primary px-4 py-2.5 text-xs"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => {
          if (!uploading) {
            inputRef.current?.click();
          }
        }}
        className={`group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:p-12 ${
          dragging
            ? "border-slate-900 bg-slate-50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        } ${
          uploading
            ? "cursor-wait opacity-80"
            : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="relative">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 ${
              dragging
                ? "scale-110 bg-violet-600 text-white"
                : "border border-slate-200 bg-slate-50 text-slate-700 group-hover:scale-105"
            }`}
          >
            <UploadCloud size={27} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-900">
            {uploading
              ? "Uploading your resume..."
              : "Drop your resume here"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {uploading ? (
              "Please wait while your resume is uploaded."
            ) : (
              <>
                or{" "}
                <span className="font-semibold text-slate-900">
                  browse your files
                </span>
              </>
            )}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-600">
              PDF
            </span>

            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-600">
              DOCX
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
              Max 10 MB
            </span>
          </div>

          {uploading && (
            <div className="mx-auto mt-7 max-w-xs">
              <div className="mb-2 flex justify-between text-[11px] font-medium text-slate-500">
                <span>Uploading</span>
                <span>Please wait...</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <AlertCircle size={17} />
          </div>

          <div>
            <p className="font-semibold">
              Upload couldn't be completed
            </p>

            <p className="mt-1 text-xs leading-5 text-rose-500">
              {error}
            </p>
          </div>
        </div>
      )}

      {file && !uploading && (
        <div className="mt-3 flex items-center gap-2 px-1 text-xs text-slate-500">
          <FileText size={14} />

          <span className="truncate">
            Selected: {file.name}
          </span>
        </div>
      )}
    </div>
  );
}