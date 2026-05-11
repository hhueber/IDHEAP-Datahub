export default function BottomStatsPanel({
  selectedArea,
  onClose,
}: any) {
  if (!selectedArea) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        borderTop: "2px solid #ddd",
        padding: "16px",
        zIndex: 4000,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>
          {selectedArea.name} ({selectedArea.level})
        </strong>

        <button onClick={onClose}>{"\u2715"}</button> {/* Unicode croix */}
      </div>

      <div style={{ marginTop: 10 }}>
        <p>Stats will be displayed here later</p> {/* le text disparaitra dans la prochaine PR */}
      </div>
    </div>
  );
}
