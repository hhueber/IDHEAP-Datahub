import { FileDropzone } from "@/utils/FileDropzone";

type DataImportDropzoneProps = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function DataImportDropzone({
  disabled = false,
  onFilesSelected,
}: DataImportDropzoneProps) {
  return (
    <FileDropzone
      labels={{
        labelKey: "dataImport.dropzone.label",
        dropZoneKey: "dataImport.dropzone.title",
        dropHintKey: "dataImport.dropzone.descriptionMultiple",
        browseKey: "dataImport.dropzone.browse",
        formatsKey: "dataImport.dropzone.formats",
        dropActiveKey: "dataImport.dropzone.dropActive",
        dropRejectKey: "dataImport.dropzone.dropReject",
      }}
      accept=".csv,.xlsx,.xls"
      acceptedMimeTypes={[
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]}
      acceptedExtensions={[".csv", ".xlsx", ".xls"]}
      disabled={disabled}
      multiple
      showFormats
      icon={'\u2191'} // Unicode pour ce symbole ↑
      onFilesAccepted={onFilesSelected}
    />
  );
}
