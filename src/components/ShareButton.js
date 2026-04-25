"use client";

import { useState } from "react";
import { getFriends, getOrCreateChat, sendMessage } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function ShareButton({ item, type = "question" }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const openShare = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const fList = await getFriends(user.uid);
      setFriends(fList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (friendUid) => {
    try {
      const chatId = await getOrCreateChat(user.uid, friendUid);
      const text = type === "question" ? item.word : item.text;
      const metadata = type === "question" 
        ? { meaning: item.correctMeaning, options: item.options || [] } 
        : { title: item.title };
      
      await sendMessage(chatId, user.uid, text, type, metadata);
      showNotification("Başarıyla paylaşıldı!", "success");
      setIsOpen(false);
    } catch (err) {
      showNotification("Paylaşılamadı.", "error");
    }
  };

  return (
    <div className="share-wrapper">
      <button className="share-trigger-btn" onClick={openShare} title="Arkadaşınla Paylaş">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      </button>

      {isOpen && (
        <div className="share-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="share-modal glass-card" onClick={e => e.stopPropagation()}>
            <div className="share-header">
              <h3>Paylaş</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className="share-list">
              {loading ? (
                <div className="share-loading">Yükleniyor...</div>
              ) : friends.length === 0 ? (
                <div className="share-empty">Henüz arkadaşın yok.</div>
              ) : (
                friends.map(f => (
                  <button key={f.id} className="share-item" onClick={() => handleShare(f.id)}>
                    <div className="share-avatar">{f.displayName?.[0]}</div>
                    <div className="share-name">{f.displayName}</div>
                    <div className="share-icon">→</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .share-trigger-btn {
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          color: var(--text-muted); width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s;
        }
        .share-trigger-btn:hover { color: var(--accent); border-color: var(--accent-muted); background: var(--glass); }
        
        .share-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .share-modal { width: 100%; max-width: 360px; padding: 0; overflow: hidden; animation: popIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .share-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .share-header h3 { font-size: 1.1rem; font-weight: 800; }
        .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; }
        
        .share-list { padding: 12px; max-height: 300px; overflow-y: auto; }
        .share-item {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px;
          background: none; border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;
          color: var(--text);
        }
        .share-item:hover { background: var(--glass); }
        .share-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--border); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
        .share-name { flex: 1; text-align: left; font-weight: 700; font-size: 0.9rem; }
        .share-icon { color: var(--accent); font-weight: 800; }
        
        .share-loading, .share-empty { padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
