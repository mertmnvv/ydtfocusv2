"use client";

// Reading-hub mimarisinin paylaşılan panel kabuğu (bkz. docs/DESIGN.md
// "Reading-merkezli IA"). Quiz/Kartlar/Gramer/Hatalarım/Tekrar/Sözlük
// artık ayrı route değil, bu bileşenle Reading üzerinden açılan
// overlay'lerdir. Reading sayfasının kendi "Ayarlar" sheet'i ve "Hızlı
// Sözlük" kartıyla aynı görsel dili (fixed overlay + blur backdrop +
// mobilde alttan sheet, masaüstünde ortalanmış kart) kullanır, ama araç
// panelleri tam sayfa içerik taşıdığı için daha geniş/yüksektir.
export default function HubPanel({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="hub-panel-overlay" onClick={onClose}>
      <div className="hub-panel-shell" onClick={(e) => e.stopPropagation()}>
        <div className="hub-panel-head">
          <span className="sheet-handle"></span>
          <div className="hub-panel-head-row">
            <h2 className="hub-panel-title">{title}</h2>
            <button className="hub-panel-close" onClick={onClose}>Kapat</button>
          </div>
        </div>
        <div className="hub-panel-body">{children}</div>
      </div>

      <style jsx>{`
        .hub-panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(6px);
          z-index: 4000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .hub-panel-shell {
          width: 100%;
          max-width: 720px;
          max-height: 92vh;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px 20px 0 0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .hub-panel-overlay { align-items: center; padding: 24px; }
          .hub-panel-shell { border-radius: 20px; max-height: 88vh; }
        }
        .hub-panel-head {
          flex-shrink: 0;
          padding: 12px 20px 14px;
          border-bottom: 1px solid var(--border);
        }
        .hub-panel-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .hub-panel-title {
          font-size: 1rem;
          font-weight: 800;
          margin: 0;
          color: var(--text);
        }
        .hub-panel-close {
          background: none;
          border: none;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          flex-shrink: 0;
        }
        .hub-panel-close:hover { color: var(--text); }
        .hub-panel-body {
          overflow-y: auto;
          padding: 4px 20px 24px;
        }
      `}</style>
    </div>
  );
}
