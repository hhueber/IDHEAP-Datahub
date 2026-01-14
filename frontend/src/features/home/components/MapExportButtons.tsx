// Boutons d’export de la carte Leaflet en PNG/PDF (capture de l’état visuel courant)
import { useState } from "react";
import { jsPDF } from "jspdf";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";

// Déclenche un téléchargement à partir d’une DataURL (PNG ou autre)
function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Capture la carte Leaflet en image via le plugin simpleMapScreenshoter
async function captureMapBlob(): Promise<Blob> {
  const map = (window as any).__leafletMap;
  if (!map) {
    const err = new Error("map.unavailable");
    // echec de recuperation de la map
    err.name = "MapUnavailable";
    throw err;
  }

  // Instancie le screenshoter une seule fois
  if (!map.__screenshoter) {
    // @ts-ignore – types manquent côté plugin
    map.__screenshoter = L.simpleMapScreenshoter({
      // régler la qualité de sortie ici si besoin
      // domtoimageOptions: { quality: 1 }, // PNG par défaut
      // hideElementsWithSelectors: ['.leaflet-control-container'], // si cacher les contrôles Leaflet
    }).addTo(map);
  }

  // Retourne un Blob (pratique pour convertir ensuite en DataURL / PDF)
  const screenshoter = map.__screenshoter;
  const blob: Blob = await screenshoter.takeScreen("blob");
  return blob;
}

export default function MapExportButtons() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const { primary, textColor, background, borderColor, hoverPrimary06 } = useTheme();

  const filenamePrefix = t("export.filenamePrefix");
  const today = new Date().toISOString().slice(0, 10);

  function getErrorKey(e: any, kind: "png" | "pdf"): string {
    if (e?.name === "MapUnavailable" || e?.message === "map.unavailable") {
      // echec de recuperation de la map
      return "export.errors.mapUnavailable";
    }
    // erreur lors des export PNG ou PDF
    return kind === "png" ? "export.errors.pngFailed" : "export.errors.pdfFailed";
  }

  // Export PNG : capture -> Blob -> DataURL -> téléchargement
  const exportPNG = async () => {
    try {
      setBusy("png");
      const blob = await captureMapBlob();
      const dataUrl = await blobToDataURL(blob);
      downloadDataUrl(`${filenamePrefix}-${today}.png`, dataUrl);
    } catch (e: any) {
      alert(t(getErrorKey(e, "png")));
    } finally {
      setBusy(null);
    }
  };

  // Export PDF : capture -> mesure image -> mise à l’échelle dans une page A4 -> save
  const exportPDF = async () => {
    try {
      setBusy("pdf");
      const blob = await captureMapBlob();
      const imgData = await blobToDataURL(blob);

      // On mesure l’image source pour conserver les proportions
      const { width, height } = await getImageSize(imgData);

      const pdf = new jsPDF({
        orientation: width >= height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      // Calcule le placement avec marges
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / width, maxH / height);
      const w = width * ratio;
      const h = height * ratio;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;

      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save(`${filenamePrefix}-${today}.pdf`);
    } catch (e: any) {
      alert(t(getErrorKey(e, "pdf")));
    } finally {
      setBusy(null);
    }
  };

  // Helpers de conversion
  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
  
  // Récupère la taille intrinsèque d’une image (DataURL)
  function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // Classes utilitaires pour les boutons
  const btn =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
    "border transition disabled:opacity-60 disabled:cursor-not-allowed " +
    "focus:outline-none " +
    "[background-color:var(--export-btn-bg)] " + // fond normal
    "hover:[background-color:var(--export-btn-hover-bg)] " // fond au hover

  // Icône spinner pendant l’export
  const spinner = (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true" style={{ color: primary }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z" fill="currentColor" className="opacity-75" />
    </svg>
  );

  return (
    <section className="rounded-2xl p-4 shadow-sm border"
      style={{
        backgroundColor: background,
        borderColor: borderColor,
        color: textColor,
      }}>
      <h2 className="text-sm font-semibold mb-2" style={{ color: textColor }}>{t("export.title")}</h2>
      {/* Actions PNG / PDF */}
      <div className="flex flex-wrap gap-2">
        <button onClick={exportPNG} disabled={busy !== null} 
          className={btn}
          title={t("export.pngTooltip")}
          style={
            {
              borderColor: borderColor,
              color: primary,
              "--export-btn-bg": background,
              "--export-btn-hover-bg": hoverPrimary06,
            } as React.CSSProperties
          }>
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" style={{ color: primary }}>
            <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" fill="currentColor" />
            <path d="M8 15l3-3 2 3 3-3 2 3v2H8v-2Z" fill="white" opacity=".6" />
          </svg>
          <span>{t("export.pngLabel")}</span>
          {busy === "png" && spinner}
        </button>

        <button onClick={exportPDF} disabled={busy !== null} 
          className={btn}
          title={t("export.pdfTooltip")}
          style={
            {
              borderColor: borderColor,
              color: primary,
              "--export-btn-bg": background,
              "--export-btn-hover-bg": hoverPrimary06,
            } as React.CSSProperties
          }>
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" style={{ color: primary }}>
            <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="currentColor" />
            <path d="M13 3v4h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{t("export.pdfLabel")}</span>
          {busy === "pdf" && spinner}
        </button>
      </div>

      {/* Note d’usage */}
      <p className="text-xs mt-2" style={{ color: hexToRgba(textColor, 0.7) }}>
        {t("export.note")}
      </p>

      {/* Annonce ARIA de l’état d’export */}
      <div className="sr-only" aria-live="polite">
        {busy === "png" ? t("export.ariaExportPng") : busy === "pdf" ? t("export.ariaExportPdf") : ""}
      </div>
    </section>
  );
}
