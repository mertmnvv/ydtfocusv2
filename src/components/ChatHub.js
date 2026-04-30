"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, orderBy, onSnapshot, getDoc, doc, updateDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendMessage, respondToFriendRequest, searchUsers, getFriends, getOrCreateChat } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import ProfileModal from "./ProfileModal";
import PremiumModal from "./PremiumModal";
import { useNotification } from "@/context/NotificationContext";

export default function ChatHub() {
  const { user, isPremium } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); 
  const [activeChat, setActiveChat] = useState(null); 
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [solvingQuestion, setSolvingQuestion] = useState(null); 
  const [solvedStatus, setSolvedStatus] = useState(null); 
  const [inputValue, setInputValue] = useState("");
  const [lastSeenUpdater, setLastSeenUpdater] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleOpenChat = (e) => {
      const { chatId } = e.detail;
      if (chatId) {
        if (!isPremium) {
          setIsPremiumModalOpen(true);
          return;
        }
        setIsOpen(true);
        const targetChat = chats.find(c => c.id === chatId);
        if (targetChat) {
          setActiveChat(targetChat);
          setActiveTab("chats");
        }
      }
    };
    window.addEventListener("focus-open-chat", handleOpenChat);
    return () => window.removeEventListener("focus-open-chat", handleOpenChat);
  }, [chats, isPremium]);

  useEffect(() => {
    if (!user || !isPremium) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    return onSnapshot(q, async (snap) => {
      const chatList = [];
      for (const d of snap.docs) {
        const data = d.data();
        const otherUid = data.participants.find(p => p !== user.uid);
        const uDoc = await getDoc(doc(db, "users", otherUid));
        const otherUser = uDoc.exists() ? { id: otherUid, ...uDoc.data() } : { id: otherUid, displayName: "Bilinmeyen" };
        chatList.push({ id: d.id, ...data, otherUser });
      }
      chatList.sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
      setChats(chatList);
    });
  }, [user, isPremium, lastSeenUpdater]);

  // Periodic UI refresh for online status
  useEffect(() => {
    const interval = setInterval(() => setLastSeenUpdater(v => v + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  function isUserOnline(userDoc) {
    if (!userDoc) return false;
    const lastSeen = userDoc.publicStats?.lastSeen || userDoc.lastLogin;
    if (!lastSeen) return false;
    const lastSeenMs = lastSeen.toMillis ? lastSeen.toMillis() : new Date(lastSeen).getTime();
    return (Date.now() - lastSeenMs) < 10 * 60 * 1000; // 10 minutes
  }

  useEffect(() => {
    if (!user || !isPremium) return;
    const fetchFriends = async () => {
      const fList = await getFriends(user.uid);
      setFriends(fList);
    };
    fetchFriends();
  }, [user, requests, isPremium]);

  useEffect(() => {
    if (!user || !isPremium) return;
    const q = query(collection(db, "friendRequests"), where("to", "==", user.uid), where("status", "==", "pending"));
    return onSnapshot(q, async (snap) => {
      const reqList = [];
      for (const d of snap.docs) {
        const data = d.data();
        const uDoc = await getDoc(doc(db, "users", data.from));
        reqList.push({ id: d.id, ...data, fromUser: uDoc.data() });
      }
      setRequests(reqList);
    });
  }, [user, isPremium]);

  useEffect(() => {
    if (!isPremium) return;
    const delayDebounceFn = setTimeout(async () => {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter(r => r.id !== user.uid).slice(0, 20));
    }, searchQuery.length > 0 ? 150 : 0);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user, isPremium]);

  useEffect(() => {
    if (!activeChat || !isPremium) return;
    const q = query(collection(db, "chats", activeChat.id, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [activeChat, isPremium]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const togglePanel = () => {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!isPremium) return;
    const text = e.target.msg.value;
    if (!text.trim() || !activeChat) return;
    e.target.msg.value = "";
    await sendMessage(activeChat.id, user.uid, text);
  };

  const handleDeleteMessage = async (msgId) => {
    if (!activeChat || !window.confirm("Bu mesajı silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "chats", activeChat.id, "messages", msgId));
      showNotification("Mesaj silindi.", "success");
    } catch (e) { console.error(e); }
  };

  const handleReadingClick = (m) => {
    const encoded = encodeURIComponent(m.text);
    router.push(`/reading?loadText=${encoded}`);
    setIsOpen(false);
  };

  const handleQuestionClick = (m) => {
    if (m.senderId === user.uid || m.metadata?.isSolved) return;
    setSolvingQuestion({ id: m.id, word: m.text, meaning: m.metadata?.meaning });
    setSolvedStatus(null);
    setInputValue("");
  };

  const checkSolution = async () => {
    if (inputValue.toLowerCase().trim() === solvingQuestion.meaning.toLowerCase().trim()) {
      setSolvedStatus("correct");
      if (activeChat) {
        await sendMessage(activeChat.id, user.uid, `✅ "${solvingQuestion.word}" kelimesini doğru bildim! Cevap: ${solvingQuestion.meaning}`, "text");
        const msgRef = doc(db, "chats", activeChat.id, "messages", solvingQuestion.id);
        await updateDoc(msgRef, { "metadata.isSolved": true });
      }
    } else {
      setSolvedStatus("wrong");
    }
  };

  const handleClearChat = async () => {
    if (!activeChat) return;
    await deleteChat(activeChat.id);
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm("Bu sohbeti tamamen silmek istediğine emin misin? Tüm mesajlar ve sohbet kaydı yok edilecek.")) return;
    try {
      // 1. Delete all messages
      const msgsRef = collection(db, "chats", chatId, "messages");
      const snap = await getDocs(query(msgsRef));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      
      // 2. Delete chat document
      await deleteDoc(doc(db, "chats", chatId));
      
      showNotification("Sohbet tamamen silindi.", "success");
      if (activeChat?.id === chatId) setActiveChat(null);
    } catch (e) { 
      console.error(e); 
      showNotification("Sohbet silinemedi.", "error"); 
    }
  };

  const handleFriendClick = async (friend) => {
    if (!isPremium) return;
    const existing = chats.find(c => c.participants.includes(friend.id));
    if (existing) {
      setActiveChat(existing);
      setActiveTab("chats");
    } else {
      try {
        const chatId = await getOrCreateChat(user.uid, friend.id);
        setActiveChat({ id: chatId, otherUser: friend, participants: [user.uid, friend.id] });
        setActiveTab("chats");
      } catch (e) { console.error(e); }
    }
  };

  const handleRequestResponse = async (reqId, status, fromUid) => {
    try {
      await respondToFriendRequest(reqId, status, fromUid, user.uid);
      showNotification(status === "accepted" ? "Arkadaşlık isteği kabul edildi." : "İstek reddedildi.", "success");
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <button className={`chat-hub-fab ${isOpen ? "active" : ""}`} onClick={togglePanel}>
        <i className={`fas ${isOpen ? "fa-times" : "fa-comments"}`}></i>
        {!isOpen && requests.length > 0 && <span className="notification-badge">{requests.length}</span>}
      </button>      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />

      {isOpen && isPremium && (
        <div className="chat-hub-panel animate-slideUp">
          <div className="hub-header">
            {activeChat ? (
              <div className="chat-header-info">
                <button className="back-btn" onClick={() => setActiveChat(null)}><i className="fas fa-chevron-left"></i></button>
                <div className="header-avatar" onClick={() => setSelectedProfileId(activeChat.otherUser.id)}>
                  {activeChat.otherUser.photoURL ? (
                    <img src={activeChat.otherUser.photoURL} alt="" />
                  ) : (
                    activeChat.otherUser.displayName?.[0]
                  )}
                </div>
                <div className="header-text">
                  <h5>{activeChat.otherUser.displayName}</h5>
                  <span className={isUserOnline(activeChat.otherUser) ? "status-online" : "status-offline"}>
                    {isUserOnline(activeChat.otherUser) ? "Online" : "Offline"}
                  </span>
                </div>
                <button className="header-trash" onClick={handleClearChat}><i className="fa-solid fa-trash-can"></i></button>
                <button className="header-close-btn" onClick={() => setIsOpen(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
            ) : (
              <>
                <div className="hub-title-row">
                  <h4 className="hub-title"><i className="fa-solid fa-comments" style={{marginRight: 8, fontSize: '0.9rem'}}></i>Sohbet</h4>
                  <button className="header-close-btn" onClick={() => setIsOpen(false)}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="hub-nav">
                   <button className={`hub-tab ${activeTab === "chats" ? "active" : ""}`} onClick={() => setActiveTab("chats")}>Sohbetler</button>
                   <button className={`hub-tab ${activeTab === "friends" ? "active" : ""}`} onClick={() => setActiveTab("friends")}>Arkadaşlar</button>
                   <button className={`hub-tab ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
                     İstekler {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
                   </button>
                   <button className={`hub-tab ${activeTab === "search" ? "active" : ""}`} onClick={() => setActiveTab("search")}>Ara</button>
                </div>
              </>
            )}
          </div>

          <div className="hub-content">
            {activeChat ? (
              <div className="active-chat-container">
                <div className="messages-list">
                  {messages.map((m, i) => (
                    <div key={m.id} className={`message-bubble ${m.senderId === user.uid ? "sent" : "received"}`}>
                      {m.senderId === user.uid && (
                        <button className="msg-delete-btn" onClick={() => handleDeleteMessage(m.id)}>
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                      {m.type === "reading" ? (
                        <div className="reading-card-msg" onClick={() => handleReadingClick(m)}>
                          <i className="fa-solid fa-book-open"></i>
                          <span>Okuma Metni Paylaşıldı</span>
                        </div>
                      ) : m.type === "question" ? (
                        <div className={`question-card-msg ${m.metadata?.isSolved ? "solved" : ""}`} onClick={() => handleQuestionClick(m)}>
                          <i className="fa-solid fa-brain"></i>
                          <div className="q-text">
                            <strong>{m.text}</strong>
                            <span>{m.metadata?.isSolved ? "Çözüldü ✅" : "Anlamı nedir?"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-msg">{m.text}</div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input type="text" name="msg" placeholder="Mesaj yazın..." autoComplete="off" />
                  <button type="submit"><i className="fa-solid fa-paper-plane"></i></button>
                </form>
              </div>
            ) : (
              <div className="tab-view">
                {activeTab === "chats" && (
                  <div className="chats-list">
                    {chats.length === 0 ? (
                      <div className="empty-state">Henüz sohbet yok.</div>
                    ) : (
                      chats.map(c => (
                        <div key={c.id} className="chat-item" onClick={() => setActiveChat(c)}>
                          <div className="chat-item-avatar">
                            {c.otherUser.photoURL ? <img src={c.otherUser.photoURL} alt="" /> : c.otherUser.displayName?.[0]}
                          </div>
                          <div className="chat-item-info">
                            <h6>{c.otherUser.displayName}</h6>
                            <p>{c.lastMessage || "Sohbeti açın..."}</p>
                          </div>
                          <button 
                            className="chat-list-delete" 
                            onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                            title="Sohbeti Sil"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "friends" && (
                  <div className="friends-list">
                    <h6>Arkadaşlarım ({friends.length})</h6>
                    {friends.length === 0 ? (
                      <div className="empty-state">Henüz arkadaşın yok.</div>
                    ) : (
                      friends.map(f => (
                        <div key={f.id} className="chat-item" onClick={() => handleFriendClick(f)}>
                          <div className={isUserOnline(f) ? "status-dot online" : "status-dot offline"}></div>
                          <div className="chat-item-avatar friend-av" onClick={(e) => { e.stopPropagation(); setSelectedProfileId(f.id); }}>
                            {f.photoURL ? <img src={f.photoURL} alt="" /> : f.displayName?.[0]}
                          </div>
                          <div className="chat-item-info">
                            <h6>{f.displayName}</h6>
                            <p>{isUserOnline(f) ? "Şu an aktif" : "Çevrimdışı"}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "requests" && (
                  <div className="friends-list">
                    <div className="requests-section">
                      {requests.length === 0 ? (
                        <div className="empty-state">Bekleyen istek yok.</div>
                      ) : (
                        requests.map(r => (
                          <div key={r.id} className="request-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="chat-item-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                {r.fromUser?.photoURL ? <img src={r.fromUser.photoURL} alt="" /> : r.fromUser?.displayName?.[0]}
                              </div>
                              <span style={{ fontWeight: 600 }}>{r.fromUser?.displayName}</span>
                            </div>
                            <div className="req-actions">
                              <button className="btn-accept" onClick={() => handleRequestResponse(r.id, "accepted", r.from)}><i className="fas fa-check"></i></button>
                              <button className="btn-reject" onClick={() => handleRequestResponse(r.id, "rejected", r.from)}><i className="fas fa-times"></i></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "search" && (
                  <div className="search-view">
                    <div className="search-box">
                      <i className="fas fa-search"></i>
                      <input type="text" placeholder="Kullanıcı ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="search-results">
                      {searchResults.map(r => (
                        <div key={r.id} className="search-item" onClick={() => setSelectedProfileId(r.id)}>
                          <div className="search-avatar">
                            {r.photoURL ? <img src={r.photoURL} alt="" /> : r.displayName?.[0]}
                          </div>
                          <div className="search-info">
                            <h6>{r.displayName}</h6>
                            <span>Profilini Gör</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProfileId && (
        <ProfileModal 
          userId={selectedProfileId} 
          isOpen={!!selectedProfileId} 
          onClose={() => setSelectedProfileId(null)} 
        />
      )}

      {solvingQuestion && (
        <div className="question-modal-overlay">
          <div className="question-modal animate-pop">
            <h3>Kelime Bilmecesi</h3>
            <p className="q-word">"{solvingQuestion.word}"</p>
            <p className="q-hint">Bu kelimenin anlamı nedir?</p>
            <input 
              type="text" 
              placeholder="Cevabınızı yazın..." 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              disabled={solvedStatus === "correct"}
            />
            {solvedStatus === "correct" && <div className="solved-success">Tebrikler! Doğru cevap.</div>}
            {solvedStatus === "wrong" && <div className="solved-error">Hatalı cevap, tekrar dene!</div>}
            <div className="q-actions">
              <button className="btn-close-q" onClick={() => setSolvingQuestion(null)}>Kapat</button>
              {solvedStatus !== "correct" && <button className="btn-submit-q" onClick={checkSolution}>Kontrol Et</button>}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-hub-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: #000; border: none; cursor: pointer; z-index: 1000; box-shadow: 0 4px 20px rgba(226, 183, 20, 0.4); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; transition: all 0.2s; }
        .chat-hub-fab:hover { transform: scale(1.1); }
        .chat-hub-fab.active { transform: rotate(90deg); background: #333; color: white; }
        .notification-badge { position: absolute; top: -5px; right: -5px; background: #ff453a; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; border: 2px solid #1c1c1e; font-weight: bold; }
        .chat-hub-panel { position: fixed; bottom: 95px; right: 24px; width: 380px; height: 620px; background: #1c1c1e; border-radius: 28px; border: 1px solid var(--border); z-index: 1000; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .hub-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(34,34,34,0.95); backdrop-filter: blur(20px); }
        .hub-nav { display: flex; gap: 6px; }
        .hub-tab { flex: 1; background: none; border: none; color: #888; padding: 10px 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; border-radius: 10px; transition: 0.2s; }
        .hub-tab.active { color: white; background: rgba(255,255,255,0.1); }
        .hub-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .hub-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: #fff; display: flex; align-items: center; }
        .header-close-btn { background: none; border: none; color: #888; cursor: pointer; padding: 8px; font-size: 1.2rem; transition: 0.2s; }
        .header-close-btn:hover { color: #fff; }
        .hub-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: #111; }
        .chat-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; cursor: pointer; transition: 0.15s; position: relative; }
        .chat-item:hover { background: #1a1a1a; }
        .chat-item:hover .chat-list-delete { opacity: 1; }
        .chat-list-delete { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #555; cursor: pointer; opacity: 0; transition: 0.2s; padding: 10px; }
        .chat-list-delete:hover { color: #ff4444; }
        .chat-item-avatar { width: 48px; height: 48px; border-radius: 14px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; overflow: hidden; flex-shrink: 0; }
        .chat-item-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .chat-item-info h6 { margin: 0; font-size: 0.95rem; font-weight: 700; }
        .chat-item-info p { margin: 2px 0 0; font-size: 0.8rem; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
        .active-chat-container { flex: 1; display: flex; flex-direction: column; height: 100%; position: relative; }
        .messages-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .message-bubble { max-width: 80%; padding: 12px 16px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; position: relative; }
        .message-bubble.sent { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 4px; padding-right: 32px; }
        .message-bubble.received { align-self: flex-start; background: #222; color: #ddd; border-bottom-left-radius: 4px; }
        .msg-delete-btn { position: absolute; top: 5px; right: 5px; background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 0.7rem; opacity: 0; transition: 0.2s; }
        .message-bubble:hover .msg-delete-btn { opacity: 1; }
        .msg-delete-btn:hover { color: #ff4444; }
        .chat-input-area { padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 10px; background: rgba(34,34,34,0.95); backdrop-filter: blur(20px); }
        .chat-input-area input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px 16px; color: white; outline: none; font-size: 0.95rem; }
        .chat-input-area input:focus { border-color: var(--accent); }
        .chat-input-area button { background: var(--primary); border: none; color: white; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .chat-input-area button:hover { transform: scale(1.05); }
        .search-view { padding: 16px; }
        .search-box { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); }
        .search-box input { background: none; border: none; color: white; outline: none; flex: 1; font-size: 0.95rem; }
        .search-results { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
        .search-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
        .search-item:hover { background: #1a1a1a; }
        .search-avatar { width: 42px; height: 42px; border-radius: 12px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-weight: bold; overflow: hidden; }
        .search-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .search-info h6 { margin: 0; font-size: 0.9rem; }
        .search-info span { font-size: 0.75rem; color: var(--primary); font-weight: 600; }
        .requests-section { padding: 12px 20px; }
        .requests-section h6 { color: #555; margin-bottom: 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
        .request-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; }
        .req-actions { display: flex; gap: 8px; }
        .req-actions button { width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: 0.2s; }
        .btn-accept { background: #1a7a3a; color: white; }
        .btn-reject { background: #333; color: #888; }
        .chat-header-info { display: flex; align-items: center; gap: 12px; width: 100%; }
        .back-btn { background: none; border: none; color: #888; cursor: pointer; padding: 8px; font-size: 1.1rem; }
        .header-avatar { width: 38px; height: 38px; border-radius: 10px; background: #444; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; overflow: hidden; }
        .header-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .header-text h5 { margin: 0; font-size: 1rem; font-weight: 700; }
        .header-trash { background: none; border: none; color: #555; cursor: pointer; margin-left: auto; padding: 8px; font-size: 0.9rem; }
        .header-trash:hover { color: #ff4444; }
        .status-online { font-size: 0.7rem; color: #30d158; font-weight: bold; }
        .status-offline { font-size: 0.7rem; color: #888; font-weight: bold; }
        .tab-badge { background: #ff453a; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; margin-left: 4px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); }
        .status-dot.online { background: #30d158; box-shadow: 0 0 8px #30d158; }
        .status-dot.offline { background: #444; }
        .friend-av { background: linear-gradient(135deg, var(--accent), #ff9f0a); color: #000; }
        .reading-card-msg { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .reading-card-msg i { font-size: 1.2rem; color: #ffd60a; }
        .question-card-msg { display: flex; align-items: center; gap: 12px; cursor: pointer; transition: transform 0.2s; }
        .question-card-msg:hover { transform: scale(1.02); }
        .question-card-msg i { font-size: 1.5rem; color: #ffd60a; }
        .question-card-msg.solved { opacity: 0.6; }
        .q-text { display: flex; flex-direction: column; }
        .q-text strong { font-size: 1rem; }
        .q-text span { font-size: 0.75rem; }
        .question-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .question-modal { background: #1c1c1e; border: 1px solid #333; padding: 30px; border-radius: 24px; width: 100%; max-width: 320px; text-align: center; }
        .q-word { font-size: 2rem; font-weight: 800; margin: 15px 0; color: #ffd60a; }
        .q-hint { color: #888; margin-bottom: 20px; }
        .question-modal input { width: 100%; background: #111; border: 1px solid #333; padding: 12px; border-radius: 12px; color: white; text-align: center; font-size: 1.1rem; margin-bottom: 15px; outline: none; }
        .q-actions { display: flex; gap: 10px; margin-top: 20px; }
        .q-actions button { flex: 1; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; }
        .btn-close-q { background: #333; color: #fff; }
        .btn-submit-q { background: #ffd60a; color: #000; }
        .solved-success { color: #30d158; font-weight: bold; margin-bottom: 10px; }
        .solved-error { color: #ff453a; font-weight: bold; margin-bottom: 10px; }
        .empty-state { text-align: center; padding: 40px 20px; color: #555; font-size: 0.9rem; }
        .friends-list h6 { padding: 12px 20px; color: #666; font-size: 0.8rem; font-weight: 700; }

        /* ─── MOBILE FULLSCREEN ─── */
        @media (max-width: 768px) {
          .chat-hub-fab { bottom: 85px; right: 16px; width: 50px; height: 50px; }
          .chat-hub-panel { inset: 0; width: 100%; height: 100%; border-radius: 0; bottom: 0; right: 0; border: none; }
          .hub-header { padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
          .hub-tab { padding: 12px 8px; font-size: 0.9rem; }
          .chat-item { padding: 14px 16px; }
          .chat-item-info p { max-width: 55vw; }
          .message-bubble { max-width: 85%; font-size: 1rem; }
          .chat-input-area { padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom)); }
          .chat-input-area input { padding: 14px 16px; font-size: 1rem; }
          .chat-input-area button { width: 48px; height: 48px; }
          .search-view { padding: 16px; }
          .search-box { padding: 14px 16px; }
          .search-box input { font-size: 1rem; }
        }
      `}</style>
    </>
  );
}
