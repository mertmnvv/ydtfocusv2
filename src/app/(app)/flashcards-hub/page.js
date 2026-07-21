"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserDecks, createUserDeck, addGlobalWords, deleteUserDeck, updateUserDeck } from "@/lib/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AI_MODELS, buildExampleSentencePrompt } from "@/constants/prompts";

const AI_CATEGORIES = [
  { value: "YDT Çıkmış Kelimeler", label: "YDT Çıkmış Kelimeler", icon: "fa-bullseye" },
  { value: "Phrasal Verbs", label: "Phrasal Verbs", icon: "fa-link" },
  { value: "Akademik Kelimeler", label: "Akademik Kelimeler", icon: "fa-graduation-cap" },
  { value: "Sık Kullanılan Bağlaçlar", label: "Bağlaçlar & Edatlar", icon: "fa-arrows-split-up-and-left" },
  { value: "Sağlık ve Tıp", label: "Sağlık & Tıp", icon: "fa-heart-pulse" },
  { value: "Teknoloji ve Bilim", label: "Teknoloji & Bilim", icon: "fa-microchip" },
  { value: "Çevre ve Doğa", label: "Çevre & Doğa", icon: "fa-leaf" },
  { value: "Tarih ve Kültür", label: "Tarih & Kültür", icon: "fa-landmark" },
  { value: "Sanat ve Edebiyat", label: "Sanat & Edebiyat", icon: "fa-palette" },
  { value: "Eğitim ve Psikoloji", label: "Eğitim & Psikoloji", icon: "fa-brain" },
  { value: "Sosyal Hayat ve İlişkiler", label: "Sosyal Hayat & İlişkiler", icon: "fa-users" },
  { value: "Ekonomi ve İş Dünyası", label: "Ekonomi & İş", icon: "fa-chart-pie" },
  { value: "Hukuk ve Siyaset", label: "Hukuk & Siyaset", icon: "fa-scale-balanced" },
  { value: "Medya ve İletişim", label: "Medya & İletişim", icon: "fa-bullhorn" },
  { value: "Coğrafya ve Uzay", label: "Coğrafya & Uzay", icon: "fa-earth-americas" },
  { value: "Seyahat ve Turizm", label: "Seyahat & Turizm", icon: "fa-plane" },
  { value: "Günlük Yaşam", label: "Günlük Yaşam", icon: "fa-sun" }
];

export default function FlashcardsHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(null); // 'ai' | 'manual' | null
  const [activeDeck, setActiveDeck] = useState(null); // the deck object currently being managed
  
  // AI Gen State
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState("B1");
  const [aiCount, setAiCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  
  // Manual Create State
  const [manualName, setManualName] = useState("");
  
  // Deck Manager State
  const [editName, setEditName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [newCardWord, setNewCardWord] = useState("");
  const [newCardMeaning, setNewCardMeaning] = useState("");
  const [newCardSentence, setNewCardSentence] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => { 
    if (user) {
      loadDecks(); 
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDecks = async () => {
    try { 
      const d = await getUserDecks(user.uid);
      setDecks(d);
      if (activeDeck) {
        const updated = d.find(x => x.id === activeDeck.id);
        if (updated) setActiveDeck(updated);
        else setActiveDeck(null);
      }
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerateAi = async (e) => {
    e.preventDefault();
    if (!aiTopic || aiCount < 5 || aiCount > 50) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, level: aiLevel, count: Number(aiCount) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const flashcards = data.flashcards || [];
      if (flashcards.length === 0) throw new Error("AI kelime üretemedi.");
      await addGlobalWords(flashcards.map(f => ({ ...f, level: aiLevel }))).catch(console.warn);
      await createUserDeck(user.uid, {
        name: `${aiTopic} (${aiLevel})`,
        cards: flashcards.map(f => ({ ...f, status: "new" })),
        totalStudied: 0, lastStudied: null
      });
      setShowModal(null);
      setAiTopic("");
      await loadDecks();
    } catch (err) { alert("Hata: " + err.message); }
    finally { setGenerating(false); }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    await createUserDeck(user.uid, { name: manualName.trim(), cards: [], totalStudied: 0, lastStudied: null });
    setManualName("");
    setShowModal(null);
    await loadDecks();
  };

  const handleDelete = async () => {
    if (!deckToDelete) return;
    const id = deckToDelete.id;
    setDeckToDelete(null);
    try {
      await deleteUserDeck(user.uid, id);
      if (activeDeck?.id === id) setActiveDeck(null);
      await loadDecks();
    } catch (err) {
      alert("Silme işlemi başarısız: " + err.message);
      console.error("Delete Error:", err);
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !activeDeck) return;
    await updateUserDeck(user.uid, activeDeck.id, { name: editName.trim() });
    setIsEditingName(false);
    loadDecks();
  };

  const handleRemoveCard = async (cardIndex) => {
    if (!activeDeck) return;
    const newCards = [...(activeDeck.cards || [])];
    newCards.splice(cardIndex, 1);
    await updateUserDeck(user.uid, activeDeck.id, { cards: newCards });
    loadDecks();
  };

  const handleMagicWand = async () => {
    if (!newCardWord.trim() || !newCardMeaning.trim()) {
      alert("Önce kelimeyi ve anlamını girmelisin.");
      return;
    }
    setMagicLoading(true);
    try {
      const { system, user: userContent } = buildExampleSentencePrompt({ word: newCardWord, meaning: newCardMeaning });
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userContent }
          ]
        })
      });
      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        setNewCardSentence(data.choices[0].message.content.trim().replace(/^"|"$/g, ''));
      }
    } catch (err) {
      console.error(err);
      alert("Cümle üretilemedi.");
    } finally {
      setMagicLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!activeDeck || !newCardWord.trim() || !newCardMeaning.trim()) return;
    const newCard = {
      word: newCardWord.trim(),
      meaning: newCardMeaning.trim(),
      sentence: newCardSentence.trim() || null,
      status: "new"
    };
    const updatedCards = [...(activeDeck.cards || []), newCard];
    await updateUserDeck(user.uid, activeDeck.id, { cards: updatedCards });
    setNewCardWord("");
    setNewCardMeaning("");
    setNewCardSentence("");
    loadDecks();
  };

  const openDeckManager = (deck) => {
    setActiveDeck(deck);
    setEditName(deck.name);
    setIsEditingName(false);
    setNewCardWord("");
    setNewCardMeaning("");
    setNewCardSentence("");
  };

  const getStackLayers = (count) => {
    if (count === 0) return 1;
    if (count <= 5) return 2;
    if (count <= 15) return 3;
    if (count <= 30) return 5;
    if (count <= 50) return 7;
    return 9; // up to 9 layers for very thick decks
  };

  const { loading: authLoading } = useAuth();
  if (authLoading || loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!user) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px", marginTop: 40, maxWidth: 500, margin: "40px auto" }}>
        <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: 20 }}></i>
        <h3 style={{ fontWeight: 800, marginBottom: 12, fontSize: '1.5rem' }}>Flashcard Destelerine Erişmek İçin Kayıt Olmalısın</h3>
        <p className="hint-text" style={{ marginBottom: 24 }}>Kendi kelime destelerinizi oluşturmak ve AI ile pratik yapmak için giriş yapmalısınız.</p>
        <button onClick={() => window.location.href='/login'} className="btn-primary" style={{ padding: '14px 32px' }}>Giriş Yap / Kayıt Ol</button>
      </div>
    );
  }

  return (
    <div className="fh-page">
      {/* Header */}
      <div className="fh-header">
        <div>
          <h1 className="fh-title">Flashcards</h1>
          <p className="fh-desc">Kendi destelerini oluştur, AI ile üret, swipe ile çalış.</p>
        </div>
        <div className="fh-btns">
          <button className="fh-btn primary" onClick={() => setShowModal("ai")}>
            <i className="fa-solid fa-wand-magic-sparkles"></i> AI Üret
          </button>
          <button className="fh-btn ghost" onClick={() => setShowModal("manual")}>
            <i className="fa-solid fa-plus"></i> Yeni Deste
          </button>
        </div>
      </div>

      {/* Decks Grid (Stacked Cards) */}
      {decks.length === 0 ? (
        <div className="glass-card fh-empty">
          <i className="fa-regular fa-layer-group fh-empty-ic"></i>
          <h3>Henüz bir desten yok</h3>
          <p>Yukarıdaki butonlarla AI destesi üret veya elle oluştur.</p>
        </div>
      ) : (
        <div className="fh-grid">
          {decks.map(deck => {
            const cards = deck.cards || [];
            const layers = getStackLayers(cards.length);
            const knownCount = cards.filter(c => c.status === "known").length;
            const pct = cards.length > 0 ? Math.round((knownCount / cards.length) * 100) : 0;
            
            return (
              <div key={deck.id} className="fh-stacked-deck" onClick={() => openDeckManager(deck)}>
                {/* Background layers for thickness */}
                {Array.from({ length: layers - 1 }).map((_, i) => {
                  const rot = i % 2 === 0 ? (i + 1) * -1.5 : (i + 1) * 1.5;
                  return (
                    <div key={i} className="fh-stack-layer" style={{ 
                      transform: `translateY(${-(i+1)*5}px) scale(${1 - (i+1)*0.015}) rotate(${rot}deg)`,
                      zIndex: -(i+1),
                      opacity: 1 - (i+1)*0.08,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
                    }}></div>
                  );
                })}
                
                {/* Top Card */}
                <div className="fh-stack-top">
                  <h3 className="fh-sd-name">{deck.name}</h3>
                  <div className="fh-sd-info">
                    <span className="fh-sd-count"><i className="fa-solid fa-layer-group"></i> {cards.length} Kart</span>
                    {cards.length > 0 && <span className="fh-sd-pct"><i className="fa-solid fa-circle-check"></i> %{pct}</span>}
                  </div>
                  {cards.length > 0 && (
                    <div className="fh-sd-bar">
                      <div className="fh-sd-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DECK MANAGER MODAL */}
      {activeDeck && (
        <div className="fh-overlay" onClick={() => setActiveDeck(null)}>
          <div className="glass-card fh-manager" onClick={e => e.stopPropagation()}>
            <div className="fh-manager-top">
              {isEditingName ? (
                <form onSubmit={handleRenameSubmit} className="fh-manager-rename">
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  <button type="submit" className="save-btn"><i className="fa-solid fa-check"></i></button>
                  <button type="button" onClick={() => { setIsEditingName(false); setEditName(activeDeck.name); }} className="cancel-btn"><i className="fa-solid fa-xmark"></i></button>
                </form>
              ) : (
                <div className="fh-manager-title">
                  <h2>{activeDeck.name}</h2>
                  <button type="button" onClick={() => setIsEditingName(true)} title="İsmi Düzenle"><i className="fa-solid fa-pen"></i></button>
                </div>
              )}
              <button type="button" className="fh-manager-close" onClick={() => setActiveDeck(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="fh-manager-actions">
              <button type="button" className="fh-btn-play" onClick={() => router.push(`/flashcards-hub/${activeDeck.id}`)} disabled={(activeDeck.cards||[]).length === 0}>
                <i className="fa-solid fa-play"></i> Hemen Oyna
              </button>
              <button type="button" className="fh-btn-del" onClick={() => setDeckToDelete(activeDeck)}>
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>

            <div className="fh-manager-content">
              {/* Add Card Form */}
              <div className="fh-add-card">
                <h4><i className="fa-solid fa-plus"></i> Yeni Kelime Ekle</h4>
                <form onSubmit={handleAddCard}>
                  <div className="fh-add-row">
                    <input type="text" placeholder="Kelime (İngilizce)" value={newCardWord} onChange={e=>setNewCardWord(e.target.value)} required />
                    <input type="text" placeholder="Anlam (Türkçe)" value={newCardMeaning} onChange={e=>setNewCardMeaning(e.target.value)} required />
                  </div>
                  <div className="fh-add-row ai-row">
                    <input type="text" placeholder="Örnek Cümle (Opsiyonel)" value={newCardSentence} onChange={e=>setNewCardSentence(e.target.value)} className="sentence-input" />
                    <button type="button" className="magic-btn" onClick={handleMagicWand} disabled={magicLoading} title="AI'dan Örnek Cümle İste">
                      {magicLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                    </button>
                  </div>
                  <button type="submit" className="fh-add-submit">Listeye Ekle</button>
                </form>
              </div>

              {/* Cards List */}
              <div className="fh-cards-list">
                <h4>Kelimeler ({(activeDeck.cards||[]).length})</h4>
                <div className="fh-cards-scroll">
                  {(activeDeck.cards||[]).length === 0 ? (
                    <p className="empty-text">Bu destede henüz kelime yok.</p>
                  ) : (
                    (activeDeck.cards||[]).map((card, i) => (
                      <div key={i} className="fh-card-item">
                        <div className="fh-card-item-info">
                          <span className="word">{card.word}</span>
                          <span className="meaning">{card.meaning}</span>
                          {card.sentence && <span className="sentence">{card.sentence}</span>}
                        </div>
                        <button className="fh-card-remove" onClick={() => handleRemoveCard(i)}><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showModal === "ai" && (
        <div className="fh-overlay" onClick={() => !generating && setShowModal(null)}>
          <div className="glass-card fh-modal" onClick={e => e.stopPropagation()}>
            <div className="fh-modal-head">
              <h2><i className="fa-solid fa-wand-magic-sparkles"></i> AI Deste Üret</h2>
              {!generating && <button className="fh-modal-x" onClick={() => setShowModal(null)}><i className="fa-solid fa-xmark"></i></button>}
            </div>
            {generating ? (
              <div className="fh-gen">
                <div className="spinner-ring"></div>
                <h3>Kelimeler hazırlanıyor...</h3>
                <p>{aiTopic} · {aiLevel} · {aiCount} kelime</p>
                <span className="hint-text">Bu işlem 5-15 saniye sürebilir.</span>
              </div>
            ) : (
              <form onSubmit={handleGenerateAi} className="fh-form">
                <div className="form-group">
                  <label>Kategori</label>
                  <select value={aiTopic} onChange={e => setAiTopic(e.target.value)} required>
                    <option value="" disabled>Bir kategori seç</option>
                    {AI_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="fh-form-row">
                  <div className="form-group">
                    <label>Seviye</label>
                    <select value={aiLevel} onChange={e => setAiLevel(e.target.value)}>
                      {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kelime Sayısı</label>
                    <input type="number" min="5" max="50" value={aiCount} onChange={e => setAiCount(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="fh-submit-btn"><i className="fa-solid fa-bolt"></i> Üret ve Kaydet</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manual Modal */}
      {showModal === "manual" && (
        <div className="fh-overlay" onClick={() => setShowModal(null)}>
          <div className="glass-card fh-modal" onClick={e => e.stopPropagation()}>
            <div className="fh-modal-head">
              <h2><i className="fa-solid fa-plus"></i> Yeni Deste</h2>
              <button className="fh-modal-x" onClick={() => setShowModal(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleCreateManual} className="fh-form">
              <div className="form-group">
                <label>Deste Adı</label>
                <input type="text" placeholder="Örn: Zorlandığım Kelimeler" value={manualName} onChange={e => setManualName(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="fh-submit-btn"><i className="fa-solid fa-plus"></i> Oluştur</button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deckToDelete && (
        <div className="fh-overlay" onClick={() => setDeckToDelete(null)} style={{ zIndex: 10000 }}>
          <div className="glass-card confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <h3>Desteyi Sil</h3>
            <p><strong>{deckToDelete.name}</strong> destesini silmek istediğine emin misin? Bu işlem geri alınamaz.</p>
            <div className="confirm-actions">
              <button type="button" className="cancel-btn" onClick={() => setDeckToDelete(null)}>İptal</button>
              <button type="button" className="delete-btn" onClick={handleDelete}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .fh-page { padding: 40px 0; max-width: 100%; animation: fadeIn .4s ease; }
        .fh-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; gap: 16px; flex-wrap: wrap; }
        .fh-title { font-size: 2rem; font-weight: 900; letter-spacing: -1px; color: var(--text); margin-bottom: 4px; }
        .fh-desc { color: var(--text-muted); font-size: .9rem; }
        .fh-btns { display: flex; gap: 10px; }
        .fh-btn { padding: 11px 18px; border-radius: 14px; font-weight: 700; border: none; cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 8px; font-size: .88rem; font-family: var(--font); }
        .fh-btn:hover { transform: translateY(-2px); }
        .fh-btn.primary { background: var(--accent); color: #000; }
        .fh-btn.ghost { background: var(--glass); border: 1px solid var(--border); color: var(--text); }

        .fh-empty { text-align: center; padding: 60px 20px; }
        .fh-empty-ic { font-size: 2.5rem; color: var(--text-muted); opacity: .35; margin-bottom: 16px; display: block; }
        .fh-empty h3 { font-size: 1.3rem; margin-bottom: 6px; font-weight: 800; }
        .fh-empty p { color: var(--text-muted); font-size: .9rem; }

        /* STACKED DECK UI */
        .fh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 32px 24px; padding-top: 20px; width: 100%; }
        .fh-stacked-deck { position: relative; cursor: pointer; transition: transform .3s cubic-bezier(0.34, 1.56, 0.64, 1); height: 260px; width: 100%; }
        .fh-stacked-deck:hover { transform: translateY(-10px); }
        
        .fh-stack-layer {
          position: absolute; inset: 0; 
          background: var(--bg-elevated); border: 1px solid var(--border); 
          border-radius: 20px; transition: all .3s;
        }
        
        .fh-stack-top {
          position: absolute; inset: 0;
          background: var(--bg-elevated); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,.2);
          display: flex; flex-direction: column; justify-content: space-between;
          z-index: 10; transition: border-color .3s;
        }
        .fh-stacked-deck:hover .fh-stack-top { border-color: rgba(226,183,20,.3); }

        .fh-sd-name { font-size: 1.25rem; font-weight: 800; color: var(--text); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-align: center; margin-top: 10px; }
        .fh-sd-info { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: auto; margin-bottom: 12px; }
        .fh-sd-count, .fh-sd-pct { font-size: .85rem; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .fh-sd-count { color: var(--text-muted); }
        .fh-sd-pct { color: var(--accent); }
        
        .fh-sd-bar { height: 5px; background: var(--glass); border-radius: 3px; overflow: hidden; }
        .fh-sd-fill { height: 100%; background: var(--accent); border-radius: 3px; }

        /* DECK MANAGER MODAL */
        /* (Margin auto added to fh-manager above to support flex-start overlay) */
        .fh-manager-top { padding: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,.1); }
        .fh-manager-title { display: flex; align-items: center; gap: 12px; }
        .fh-manager-title h2 { font-size: 1.3rem; font-weight: 800; color: var(--text); }
        .fh-manager-title button { background: none; border: none; color: var(--text-muted); cursor: pointer; transition: .2s; }
        .fh-manager-title button:hover { color: var(--accent); }
        .fh-manager-close { background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer; }
        .fh-manager-close:hover { color: var(--text); }
        
        .fh-manager-rename { display: flex; gap: 6px; align-items: center; flex: 1; margin-right: 16px; }
        .fh-manager-rename input { flex: 1; background: var(--glass); border: 1px solid var(--accent); padding: 8px 12px; border-radius: 10px; color: var(--text); font-weight: 700; outline: none; font-family: var(--font); }
        .fh-manager-rename button { background: var(--glass); border: 1px solid var(--border); border-radius: 8px; width: 36px; height: 36px; cursor: pointer; color: var(--text-muted); }
        .fh-manager-rename .save-btn { color: var(--accent); border-color: rgba(226,183,20,.3); }
        .fh-manager-rename .save-btn:hover { background: rgba(226,183,20,.1); }

        .fh-manager-actions { padding: 20px 24px; display: flex; gap: 12px; border-bottom: 1px solid var(--border); }
        .fh-btn-play { flex: 1; padding: 14px; border-radius: 12px; background: var(--accent); color: #000; font-weight: 800; font-size: 1rem; border: none; cursor: pointer; transition: .2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .fh-btn-play:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(226,183,20,.3); }
        .fh-btn-play:disabled { opacity: .4; pointer-events: none; box-shadow: none; }
        .fh-btn-del { padding: 0 20px; border-radius: 12px; background: rgba(255,69,58,.1); border: 1px solid rgba(255,69,58,.2); color: #ff453a; font-size: 1.1rem; cursor: pointer; transition: .2s; }
        .fh-btn-del:hover { background: #ff453a; color: #fff; }

        .fh-manager-content { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
        
        .fh-add-card h4, .fh-cards-list h4 { font-size: .85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .fh-add-card form { display: flex; flex-direction: column; gap: 10px; }
        .fh-add-row { display: flex; gap: 10px; }
        .fh-add-row input { flex: 1; background: var(--glass); border: 1px solid var(--border); padding: 12px; border-radius: 10px; color: var(--text); font-size: .9rem; outline: none; transition: .2s; font-family: var(--font); }
        .fh-add-row input:focus { border-color: var(--accent); }
        .ai-row { position: relative; }
        .sentence-input { padding-right: 48px !important; }
        .magic-btn { position: absolute; right: 6px; top: 6px; bottom: 6px; width: 36px; border-radius: 8px; background: rgba(226,183,20,.15); border: none; color: var(--accent); cursor: pointer; transition: .2s; }
        .magic-btn:hover:not(:disabled) { background: var(--accent); color: #000; }
        .magic-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fh-add-submit { padding: 12px; border-radius: 10px; background: var(--glass); border: 1px solid var(--border); color: var(--text); font-weight: 700; cursor: pointer; transition: .2s; margin-top: 4px; }
        .fh-add-submit:hover { background: rgba(255,255,255,.1); }

        .fh-cards-scroll { display: flex; flex-direction: column; gap: 8px; }
        .empty-text { font-size: .9rem; color: var(--text-muted); font-style: italic; }
        .fh-card-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(0,0,0,.2); border: 1px solid var(--border); border-radius: 12px; }
        .fh-card-item-info { display: flex; flex-direction: column; gap: 4px; }
        .fh-card-item-info .word { font-weight: 800; color: var(--text); font-size: 1rem; }
        .fh-card-item-info .meaning { color: var(--accent); font-size: .85rem; font-weight: 600; }
        .fh-card-item-info .sentence { color: var(--text-muted); font-size: .8rem; font-style: italic; margin-top: 4px; }
        .fh-card-remove { background: none; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; padding: 8px; transition: .2s; }
        .fh-card-remove:hover { color: #ff453a; }

        /* Modals (AI & Manual) */
        .fh-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); backdrop-filter: blur(10px); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 40px 20px; overflow-y: auto; animation: fadeIn .2s; }
        .fh-modal { max-width: 460px; width: 100%; padding: 28px; margin: auto; }
        .fh-manager { max-width: 500px; width: 100%; padding: 0; display: flex; flex-direction: column; max-height: 85vh; margin: auto; }
        .fh-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .fh-modal-head h2 { font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        .fh-modal-head h2 i { color: var(--accent); }
        .fh-modal-x { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: .2s; }
        .fh-modal-x:hover { color: var(--text); }

        .fh-form { display: flex; flex-direction: column; gap: 14px; }
        .fh-form .form-group select,
        .fh-form .form-group input { background: var(--glass); border: 1px solid var(--border); padding: 13px 14px; border-radius: 14px; color: var(--text); font-size: .95rem; outline: none; transition: .2s; font-weight: 600; font-family: var(--font); width: 100%; }
        .fh-form .form-group select:focus,
        .fh-form .form-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(226,183,20,.1); }
        .fh-form .form-group select option { background: var(--bg-elevated); color: var(--text); }
        .fh-form-row { display: flex; gap: 12px; }
        .fh-form-row .form-group { flex: 1; }
        .fh-submit-btn { width: 100%; padding: 16px; margin-top: 8px; border-radius: 14px; background: var(--accent); color: #000; font-weight: 800; font-size: 1.05rem; border: none; cursor: pointer; transition: .2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .fh-submit-btn:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(226,183,20,.3); }

        .fh-gen { text-align: center; padding: 36px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .fh-gen h3 { font-size: 1.1rem; font-weight: 800; }
        .fh-gen p { color: var(--accent); font-weight: 700; font-size: .9rem; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        /* Confirm Modal */
        .confirm-modal { width: 90%; max-width: 400px; text-align: center; padding: 32px 24px; animation: slideUp .3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .confirm-icon { font-size: 3rem; color: #ff453a; margin-bottom: 16px; }
        .confirm-modal h3 { font-size: 1.5rem; color: var(--text); margin-bottom: 12px; }
        .confirm-modal p { color: var(--text-muted); font-size: 1rem; line-height: 1.5; margin-bottom: 24px; }
        .confirm-actions { display: flex; gap: 12px; }
        .confirm-actions button { flex: 1; padding: 12px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: .2s; border: none; }
        .confirm-actions .cancel-btn { background: var(--bg-elevated); color: var(--text); border: 1px solid var(--border); }
        .confirm-actions .cancel-btn:hover { background: rgba(255,255,255,.05); }
        .confirm-actions .delete-btn { background: rgba(255,69,58,.1); color: #ff453a; border: 1px solid rgba(255,69,58,.3); }
        .confirm-actions .delete-btn:hover { background: #ff453a; color: #fff; transform: translateY(-2px); }

        @media (max-width: 768px) {
          .fh-page { padding: 16px; min-height: 100dvh; overflow-x: hidden; }
          .fh-header { flex-direction: column; text-align: center; gap: 16px; }
          .fh-btns { width: 100%; }
          .fh-btn { flex: 1; justify-content: center; }
          .fh-add-row { flex-direction: column; }
          .fh-grid { grid-template-columns: repeat(2, 1fr); gap: 20px 12px; width: 100%; margin: 0; }
          .fh-stacked-deck { height: 220px; width: 100%; }
          .fh-sd-name { font-size: 1.05rem; -webkit-line-clamp: 3; }
          .fh-manager-top { padding: 16px; }
          .fh-manager-actions { padding: 16px; flex-direction: column; }
          .fh-modal { padding: 20px; }
          .fh-overlay { padding: 20px 12px; }
        }
      `}</style>
    </div>
  );
}
