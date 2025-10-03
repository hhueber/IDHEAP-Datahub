import { useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function captureMapCanvas(): Promise<HTMLCanvasElement> {
  const el = document.querySelector<HTMLElement>("[data-map-root] .leaflet-container");
  if (!el) throw new Error("Carte introuvable.");
  const canvas = await html2canvas(el, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: window.devicePixelRatio || 1,
    logging: false,
  });
  return canvas;
}

export default function MapExportButtons() {
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const exportPNG = async () => {
    try {
      setBusy("png");
      const canvas = await captureMapCanvas();
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      downloadDataUrl(`carte-${new Date().toISOString().slice(0, 10)}.png`, dataUrl);
    } catch (e: any) {
      alert(e?.message || "Export PNG impossible (CORS ?).");
    } finally {
      setBusy(null);
    }
  };

  const exportPDF = async () => {
    try {
      setBusy("pdf");
      const canvas = await captureMapCanvas();
      const imgData = canvas.toDataURL("image/png", 1.0);

      const imgW = canvas.width, imgH = canvas.height;
      const pdf = new jsPDF({
        orientation: imgW >= imgH ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / imgW, maxH / imgH);
      const w = imgW * ratio, h = imgH * ratio;
      const x = (pageW - w) / 2, y = (pageH - h) / 2;

      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save(`carte-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e: any) {
      alert(e?.message || "Export PDF impossible (CORS ?).");
    } finally {
      setBusy(null);
    }
  };

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