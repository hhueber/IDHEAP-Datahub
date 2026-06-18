// composant de drag and drop de fichier pour l'ensemble de l'application
import React, { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";

export type FileDropzoneLabels = {
  labelKey?: string;
  dropZoneKey: string;
  dropHintKey: string;
  browseKey: string;
  formatsKey?: string;
  dropActiveKey: string;
  dropRejectKey: string;
};

type FileDropzoneProps = {
  labels: FileDropzoneLabels;

  accept: string;
  acceptedMimeTypes?: string[];
  acceptedExtensions?: string[];

  maxSizeMb?: number;
  showFormats?: boolean;

  disabled?: boolean;

  allowTextUrl?: boolean;
  hasValue?: boolean;

  icon?: React.ReactNode;

  onFileAccepted: (file: File) => void | Promise<void>;
  onUrlAccepted?: (url: string) => void;
  onClear?: () => void;
  onError?: (message: string) => void;

  className?: string;
};

export function FileDropzone({
  labels,
  accept,
  acceptedMimeTypes = [],
  acceptedExtensions = [],
  maxSizeMb,
  showFormats = true,
  disabled = false,
  allowTextUrl = false,
  hasValue = false,
  icon = "\u2191", // Unicode pour ce symbole ↑
  onFileAccepted,
  onUrlAccepted,
  onClear,
  onError,
  className = "",
}: FileDropzoneProps) {
  const { t } = useTranslation();
  const {primary, background, borderColor, textColor, hoverPrimary10, hoverPrimary15} = useTheme();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);

  const formatLabel =
    labels.formatsKey && showFormats
      ? t(labels.formatsKey, { size: maxSizeMb })
      : null;

  const validateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase();

    const mimeOk =
      acceptedMimeTypes.length === 0 || acceptedMimeTypes.includes(file.type);

    const extensionOk =
      acceptedExtensions.length === 0 ||
      acceptedExtensions.some((extension) =>
        lowerName.endsWith(extension.toLowerCase())
      );

    if (!mimeOk && !extensionOk) {
      return t("common.invalidFileType");
    }

    if (maxSizeMb !== undefined) {
      const maxBytes = maxSizeMb * 1024 * 1024;

      if (file.size > maxBytes) {
        return t("common.fileTooLarge", { size: maxSizeMb });
      }
    }

    return null;
  };

  const handleFile = async (file: File) => {
    if (disabled) return;

    const error = validateFile(file);

    if (error) {
      setIsDragReject(true);
      onError?.(error);
      return;
    }

    setIsDragReject(false);
    await onFileAccepted(file);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounterRef.current = 0;
    setIsDragActive(false);
    setIsDragReject(false);

    if (disabled) return;
    if (allowTextUrl) {
      const text = event.dataTransfer.getData("text/plain")?.trim();

      if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/"))) {
        onUrlAccepted?.(text);
        return;
      }
    }
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;
    await handleFile(file);
    event.target.value = "";
  };

  const updateDragRejectState = (event: DragEvent<HTMLDivElement>) => {
    const item = event.dataTransfer.items?.[0];

    if (!item) return;
    if (item.kind === "string" && allowTextUrl) {
      setIsDragReject(false);
      return;
    }
    if (item.kind !== "file") {
      setIsDragReject(true);
      return;
    }

    const mimeOk =
      acceptedMimeTypes.length === 0 || acceptedMimeTypes.includes(item.type);

    /*
      Pendant le drag, le navigateur ne donne pas toujours le nom du fichier,
      donc on ne peut pas toujours vérifier l’extension ici.
      La vraie validation se fait dans handleFile().
    */
    if (!mimeOk && acceptedExtensions.length === 0) {
      setIsDragReject(true);
      return;
    }

    setIsDragReject(false);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;
    dragCounterRef.current += 1;
    setIsDragActive(true);
    updateDragRejectState(event);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    updateDragRejectState(event);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragActive(false);
      setIsDragReject(false);
    }
  };

  return (
    <div className={["space-y-2", className].join(" ")}>
      {labels.labelKey && (
        <label className="text-sm font-medium opacity-80">
          {t(labels.labelKey)}
        </label>
      )}

      <div
        className={[
          "group relative rounded-2xl border p-6 transition-all duration-200 cursor-pointer overflow-hidden",
          "hover:-translate-y-[1px] hover:shadow-md",
          isDragActive ? "scale-[1.01]" : "scale-100",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
        style={{
          borderColor: isDragReject
            ? "#ef4444"
            : isDragActive
              ? primary
              : borderColor,
          backgroundColor: isDragActive ? hoverPrimary10 : background,
          boxShadow: isDragActive
            ? `0 0 0 3px ${hoverPrimary15}`
            : "0 1px 2px rgba(0,0,0,0.04)",
        }}
        onClick={() => {
          if (!disabled) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !disabled) {
            fileInputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label={t(labels.dropZoneKey)}
      >
        {isDragActive && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: hoverPrimary10 }}
            aria-hidden
          >
            <div
              className="rounded-full border px-4 py-2 text-sm font-semibold shadow-sm"
              style={{
                borderColor: isDragReject ? "#ef4444" : primary,
                color: isDragReject ? "#ef4444" : primary,
                backgroundColor: background,
              }}
            >
              {isDragReject
                ? t(labels.dropRejectKey)
                : t(labels.dropActiveKey)}
            </div>
          </div>
        )}

        <div
          className={[
            "flex flex-col items-center justify-center text-center transition-all duration-200",
            isDragActive ? "opacity-0 scale-95" : "opacity-100 scale-100",
          ].join(" ")}
        >
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold transition-transform duration-200 group-hover:scale-110"
            style={{
              borderColor,
              backgroundColor: hoverPrimary10,
              color: primary,
            }}
          >
            {icon}
          </div>

          <p className="text-sm font-medium">
            {t(labels.dropZoneKey)}
          </p>

          <p className="mt-1 text-xs opacity-60">
            {t(labels.dropHintKey)}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-xs font-medium transition hover:opacity-90"
              style={{
                borderColor,
                color: textColor,
                backgroundColor: hoverPrimary10,
              }}
              onClick={(event) => {
                event.stopPropagation();

                if (!disabled) {
                  fileInputRef.current?.click();
                }
              }}
            >
              {t(labels.browseKey)}
            </button>

            {hasValue && onClear && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-xs font-medium transition hover:opacity-90"
                style={{
                  borderColor,
                  color: textColor,
                  backgroundColor: background,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
              >
                {t("common.clear")}
              </button>
            )}
          </div>

          {formatLabel && (
            <div className="mt-3 text-[11px] opacity-50">
              {formatLabel}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
