import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { DataImportDropzone } from "@/features/dataImport/components/DataImportDropzone";
import { DataImportYearsInput } from "@/features/dataImport/components/years/DataImportYearsInput";

type DataImportUploadPanelProps = {
  loading: boolean;
  onSubmit: (params: {
    files: File[];
    displayName: string | null;
    years: number[];
  }) => Promise<void>;
};

export function DataImportUploadPanel({
  loading,
  onSubmit,
}: DataImportUploadPanelProps) {
  const { t } = useTranslation();
  const {textColor, background, borderColor, hoverPrimary04, primary} = useTheme();

  const [files, setFiles] = React.useState<File[]>([]);
  const [displayName, setDisplayName] = React.useState("");
  const [years, setYears] = React.useState<number[]>([]);
  const [yearsError, setYearsError] = React.useState<string | null>(null);

  const addFiles = React.useCallback((nextFiles: File[]) => {
    setFiles((currentFiles) =>
      mergeFilesWithoutDuplicates(currentFiles, nextFiles)
    );
  }, []);

  const removeFile = (fileToRemove: File) => {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (file) => getFileKey(file) !== getFileKey(fileToRemove)
      )
    );
  };

  const submit = async () => {
    if (
      files.length === 0 ||
      loading
    ) {
      return;
    }

    if (years.length === 0) {
      setYearsError(
        t("dataImport.years.required")
      );

      return;
    }

    setYearsError(null);

    await onSubmit({
      files,
      displayName:
        displayName.trim() || null,
      years,
    });
  };

  const totalSize = React.useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files]
  );

  return (
    <section
      className="rounded-3xl border p-4 sm:p-6"
      style={{ backgroundColor: background, borderColor, color: textColor }}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold">
          {t("dataImport.upload.title")}
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 opacity-70">
          {t("dataImport.upload.description")}
        </p>
      </div>

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-medium">
          {t("dataImport.upload.folderName")}
        </span>

        <input
          type="text"
          value={displayName}
          maxLength={120}
          disabled={loading}
          placeholder={t("dataImport.upload.folderNamePlaceholder")}
          onChange={(event) => setDisplayName(event.target.value)}
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none disabled:opacity-50"
          style={{
            borderColor,
            backgroundColor: background,
            color: textColor,
          }}
        />

        <span className="mt-1 block text-xs opacity-60">
          {t("dataImport.upload.folderNameHelp")}
        </span>
      </label>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            {t("dataImport.years.label")}
          </span>

          <span className="text-xs opacity-55">
            {t("dataImport.years.requiredBadge")}
          </span>
        </div>

        <DataImportYearsInput
          years={years}
          disabled={loading}
          error={yearsError}
          onChange={(nextYears) => {
            setYears(nextYears);

            if (nextYears.length > 0) {
              setYearsError(null);
            }
          }}
        />
      </div>

      <DataImportDropzone
        disabled={loading}
        onFilesSelected={addFiles}
      />

      {files.length > 0 && (
        <div
          className="mt-5 rounded-2xl border p-4"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                {t("dataImport.upload.selectedFiles")}
              </h3>

              <p className="mt-1 text-xs opacity-65">
                {files.length} {t("dataImport.upload.files")} ·{" "}
                {formatFileSize(totalSize)}
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => setFiles([])}
              className="w-fit rounded-xl border px-3 py-2 text-sm transition hover:opacity-80 disabled:opacity-40"
              style={{ borderColor, backgroundColor: background }}
            >
              {t("dataImport.upload.clear")}
            </button>
          </div>

          <div className="grid gap-2">
            {files.map((file) => (
              <div
                key={getFileKey(file)}
                className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                style={{ borderColor, backgroundColor: background }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {file.name}
                  </div>

                  <div className="mt-0.5 text-xs opacity-60">
                    {formatFileSize(file.size)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => removeFile(file)}
                  className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition hover:opacity-80 disabled:opacity-40"
                  style={{ borderColor }}
                >
                  {t("common.remove")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={loading || files.length === 0 || years.length === 0}
          onClick={() => void submit()}
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: primary,
            backgroundColor: primary,
            color: "#ffffff",
          }}
        >
          {t("dataImport.upload.create")}
        </button>
      </div>
    </section>
  );
}

function mergeFilesWithoutDuplicates(
  currentFiles: File[],
  nextFiles: File[]
): File[] {
  const filesByKey = new Map<string, File>();

  for (const file of [...currentFiles, ...nextFiles]) {
    filesByKey.set(getFileKey(file), file);
  }

  return Array.from(filesByKey.values());
}

function getFileKey(file: File): string {
  return [
    file.name,
    file.size,
    file.lastModified,
    file.type,
  ].join(":");
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
