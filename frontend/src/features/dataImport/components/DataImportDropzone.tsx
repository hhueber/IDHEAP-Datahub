import { FileDropzone } from "@/utils/FileDropzone";

type DataImportDropzoneProps = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

export function DataImportDropzone({
  disabled = false,
  onFileSelected,
}: DataImportDropzoneProps) {
  return (
    <FileDropzone
      labels={{
        labelKey: "dataImport.dropzone.label",
        dropZoneKey: "dataImport.dropzone.title",
        dropHintKey: "dataImport.dropzone.description",
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
      showFormats
      icon={'\u2191'} // Unicode pour ce symbole ↑
      onFileAccepted={onFileSelected}
    />
  );
}
