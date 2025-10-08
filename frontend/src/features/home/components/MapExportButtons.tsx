import { useState } from "react";
import { jsPDF } from "jspdf";

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function captureMapBlob(): Promise<Blob> {
  const map = (window as any).__leafletMap;
  if (!map) throw new Error("Carte indisponible.");

  // instancier (une seule fois)
  if (!map.__screenshoter) {
    // @ts-ignore – types manquent côté plugin
    map.__screenshoter = L.simpleMapScreenshoter({
      // régler la qualité de sortie ici si besoin
      // domtoimageOptions: { quality: 1 }, // PNG par défaut
      // hideElementsWithSelectors: ['.leaflet-control-container'], // si cacher les contrôles Leaflet
    }).addTo(map);
  }

  const screenshoter = map.__screenshoter;
  // "blob" = le plus pratique pour PNG/PDF ensuite
  const blob: Blob = await screenshoter.takeScreen("blob");
  return blob;
}

export default function MapExportButtons() {
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const exportPNG = async () => {
    try {
      setBusy("png");
      const blob = await captureMapBlob();
      const dataUrl = await blobToDataURL(blob);
      downloadDataUrl(`carte-${new Date().toISOString().slice(0, 10)}.png`, dataUrl);
    } catch (e: any) {
      alert(e?.message || "Export PNG impossible.");
    } finally {
      setBusy(null);
    }
  };

  const exportPDF = async () => {
    try {
      setBusy("pdf");
      const blob = await captureMapBlob();
      const imgData = await blobToDataURL(blob);

      // connaître la taille de l’image (pour garder les proportions)
      const { width, height } = await getImageSize(imgData);

      const pdf = new jsPDF({
        orientation: width >= height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

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
      pdf.save(`carte-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e: any) {
      alert(e?.message || "Export PDF impossible.");
    } finally {
      setBusy(null);
    }
  };

  // helpers
  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
  function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
}

  const btn =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
    "bg-white ring-1 ring-indigo-200 text-indigo-700 " +
    "hover:bg-indigo-50 hover:ring-indigo-300 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 " +
    "disabled:opacity-60 disabled:cursor-not-allowed transition";

  const spinner = (
    <svg className="h-4 w-4 animate-spin text-indigo-700" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z" fill="currentColor" className="opacity-75" />
    </svg>
  );

  return (
    <section className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm shadow-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Export</h2>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportPNG} disabled={busy !== null} className={btn} title="Exporter en PNG">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-700" aria-hidden="true">
            <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" fill="currentColor" />
            <path d="M8 15l3-3 2 3 3-3 2 3v2H8v-2Z" fill="white" opacity=".6" />
          </svg>
          <span>PNG</span>
          {busy === "png" && spinner}
        </button>

        <button onClick={exportPDF} disabled={busy !== null} className={btn} title="Exporter en PDF">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-700" aria-hidden="true">
            <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="currentColor" />
            <path d="M13 3v4h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>PDF</span>
          {busy === "pdf" && spinner}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        La capture reprend exactement la vue actuelle (zoom/déplacement) sans le menu.
      </p>

      <div className="sr-only" aria-live="polite">
        {busy === "png" ? "Export PNG en cours" : busy === "pdf" ? "Export PDF en cours" : ""}
      </div>
    </section>
  );
}