"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, orderBy, onSnapshot, getDoc, doc, updateDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendMessage, respondToFriendRequest, searchUsers, getFriends, getOrCreateChat } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import ProfileModal from "./ProfileModal";
import { useNotification } from "@/context/NotificationContext";

export default function ChatHub() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleOpenChat = (e) => {
      const { chatId } = e.detail;
      if (chatId) {
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
  }, [chats]);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      const fList = await getFriends(user.uid);
      setFriends(fList);
    };
    fetchFriends();
  }, [user, requests]);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter(r => r.id !== user.uid).slice(0, 5));
    }, searchQuery.length > 0 ? 150 : 0);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, "chats", activeChat.id, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = e.target.msg.value;
    if (!text.trim() || !activeChat) return;
    e.target.msg.value = "";
    await sendMessage(activeChat.id, user.uid, text);
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
    if (!activeChat || !window.confirm("Tüm mesaj geçmişi silinecek. Emin misin?")) return;
    try {
      const msgsRef = collection(db, "chats", activeChat.id, "messages");
      // Not: Client-side'da toplu silme (batch delete) sınırı vardır ama bu ölçekte yeterli.
      // Firebase'de subcollection silmek için her dokümanı tek tek silmek gerekir.
      const snap = await getDocs(query(msgsRef));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      
      // Son mesajı da güncelle
      const chatRef = doc(db, "chats", activeChat.id);
      await updateDoc(chatRef, { lastMessage: "Mesaj geçmişi temizlendi." });
      
      showNotification("Sohbet temizlendi.", "success");
    } catch (err) {
      console.error(err);
      showNotification("Sohbet temizlenemedi.", "error");
    }
  };

  const handleFriendClick = async (friend) => {
    // Mevcut bir sohbet var mı kontrol et
    const existing = chats.find(c => c.participants.includes(friend.id));
    if (existing) {
      setActiveChat(existing);
    } else {
      try {
        const chatId = await getOrCreateChat(user.uid, friend.id);
        setActiveChat({ id: chatId, otherUser: friend, participants: [user.uid, friend.id] });
      } catch (err) {
        showNotification("Sohbet başlatılamadı.", "error");
      }
    }
    setActiveTab("chats");
  };

  const handleRequest = async (reqId, status, fromUid) => {
    try {
      await respondToFriendRequest(reqId, status, fromUid, user.uid);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className={`chat-hub-container ${isOpen ? "expanded" : ""}`}>
      <button className="chat-hub-trigger" onClick={() => setIsOpen(!isOpen)}>
        <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-message"}`}></i>
        {!isOpen && (chats.length > 0 || requests.length > 0) && <span className="unread-dot"></span>}
      </button>

      {isOpen && (
        <div className="chat-hub-window glass-card animate-pop">
          {!activeChat ? (
            <div className="hub-main-view">
              <div className="hub-tabs">
                <button className={`hub-tab ${activeTab === "chats" ? "active" : ""}`} onClick={() => setActiveTab("chats")}>Mesajlar</button>
                <button className={`hub-tab ${activeTab === "friends" ? "active" : ""}`} onClick={() => setActiveTab("friends")}>Arkadaşlar</button>
                <button className={`hub-tab ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
                  İstekler {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
                </button>
                <button className={`hub-tab ${activeTab === "search" ? "active" : ""}`} onClick={() => setActiveTab("search")}>Ara</button>
              </div>

              <div className="hub-content scroll-styled">
                {activeTab === "chats" && (
                  <div className="chat-items">
                    {chats.length === 0 ? <div className="empty-state">Henüz mesaj yok.</div> : chats.map(chat => (
                      <div key={chat.id} className="chat-item" onClick={() => setActiveChat(chat)}>
                        <div className="chat-item-avatar msg-av" onClick={(e) => { e.stopPropagation(); setSelectedProfileId(chat.otherUser.id); }}>
                          {chat.otherUser.photoURL ? (
                            <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="chat-avatar-img" />
                          ) : (
                            chat.otherUser.displayName?.[0]
                          )}
                        </div>
                        <div className="chat-item-info">
                          <div className="chat-item-name">
                            {chat.otherUser.displayName}
                            {chat.otherUser.role === "admin" ? (
                              <i className="fa-solid fa-user-shield" style={{ color: "#ff453a", marginLeft: 6, fontSize: "0.7rem" }}></i>
                            ) : chat.otherUser.role === "premium" ? (
                              <i className="fa-solid fa-crown" style={{ color: "#ffd60a", marginLeft: 6, fontSize: "0.7rem" }}></i>
                            ) : null}
                          </div>
                          <div className="chat-item-last truncate">{chat.lastMessage || "Sohbeti başlat..."}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "friends" && (
                  <div className="chat-items">
                    {friends.map(f => (
                      <div key={f.id} className="chat-item" onClick={() => handleFriendClick(f)}>
                        <div className="friend-item-indicator"></div>
                        <div className="chat-item-avatar friend-av" onClick={(e) => { e.stopPropagation(); setSelectedProfileId(f.id); }}>
                          {f.photoURL ? (
                            <img src={f.photoURL} alt={f.displayName} className="chat-avatar-img" />
                          ) : (
                            f.displayName?.[0]
                          )}
                        </div>
                        <div className="chat-item-info">
                          <div className="chat-item-name">
                            {f.displayName}
                            {f.role === "admin" ? (
                              <i className="fa-solid fa-user-shield" style={{ color: "#ff453a", marginLeft: 6, fontSize: "0.7rem" }}></i>
                            ) : f.role === "premium" ? (
                              <i className="fa-solid fa-crown" style={{ color: "#ffd60a", marginLeft: 6, fontSize: "0.7rem" }}></i>
                            ) : null}
                          </div>
                          <div className="chat-item-last">Mesaj göndermek için dokun</div>
                        </div>
                        <button className="mini-profile-btn" onClick={(e) => { e.stopPropagation(); setSelectedProfileId(f.id); }}>
                          <i className="fa-solid fa-user"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "requests" && (
                  <div className="chat-items">
                    {requests.length === 0 ? <div className="empty-state">Bekleyen istek yok.</div> : requests.map(req => (
                      <div key={req.id} className="chat-item request-mode">
                        <div className="chat-item-avatar req-av">{req.fromUser?.displayName?.[0]}</div>
                        <div className="chat-item-info">
                          <div className="chat-item-name">{req.fromUser?.displayName}</div>
                          <div className="chat-item-last">Arkadaşlık isteği gönderdi</div>
                        </div>
                        <div className="chat-item-actions">
                          <button className="mini-btn-check" onClick={() => handleRequest(req.id, "accepted", req.from)}><i className="fa-solid fa-check"></i></button>
                          <button className="mini-btn-x" onClick={() => handleRequest(req.id, "declined", req.from)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "search" && (
                  <div className="search-view">
                    <div className="hub-search-bar">
                      <i className="fa-solid fa-magnifying-glass"></i>
                      <input 
                        placeholder="Kullanıcı adı ile ara..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        autoFocus
                      />
                    </div>
                    <div className="search-results-list">
                      <div className="search-section-title">
                        {searchQuery.length > 0 ? "ARAMA SONUÇLARI" : "SON KAYIT OLANLAR"}
                      </div>
                      {searchResults.length > 0 ? searchResults.map(r => (
                        <div key={r.id} className="chat-item search-item" onClick={() => setSelectedProfileId(r.id)}>
                          <div className="chat-item-avatar search-av">
                            {r.photoURL ? (
                              <img src={r.photoURL} alt={r.displayName} className="chat-avatar-img" />
                            ) : (
                              r.displayName?.[0]
                            )}
                          </div>
                          <div className="chat-item-info">
                            <div className="chat-item-name">{r.displayName}</div>
                            <div className="chat-item-last">Profilini görüntüle</div>
                          </div>
                          <button className="search-profile-btn">Profil</button>
                        </div>
                      )) : searchQuery.length > 0 && <div className="empty-state">Kullanıcı bulunamadı.</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="chat-active-view">
              <div className="chat-window-header glass-card">
                <button className="back-btn" onClick={() => setActiveChat(null)}>
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div className="header-user-info" onClick={() => setSelectedProfileId(activeChat.otherUser.id)} style={{ cursor: 'pointer' }}>
                  <div className={`header-avatar ${activeChat.otherUser.role === 'admin' ? 'role-admin' : activeChat.otherUser.role === 'premium' ? 'role-premium' : ''}`}>
                    {activeChat.otherUser.photoURL ? (
                      <img src={activeChat.otherUser.photoURL} alt={activeChat.otherUser.displayName} className="chat-header-img" />
                    ) : (
                      activeChat.otherUser.displayName?.[0]
                    )}
                  </div>
                  <div className="header-name-group">
                    <span className="header-name">
                      {activeChat.otherUser.displayName}
                      {activeChat.otherUser.role === "admin" ? (
                        <i className="fa-solid fa-user-shield" style={{ color: "#ff453a", marginLeft: 6, fontSize: "0.7rem" }}></i>
                      ) : activeChat.otherUser.role === "premium" ? (
                        <i className="fa-solid fa-crown" style={{ color: "#ffd60a", marginLeft: 6, fontSize: "0.7rem" }}></i>
                      ) : null}
                    </span>
                    <span className="header-status">Profili Gör</span>
                  </div>
                </div>
                <button className="clear-chat-btn" onClick={handleClearChat} title="Sohbeti Temizle">
                  <i className="fa-regular fa-trash-can"></i>
                </button>
              </div>
              
              <div className="chat-messages scroll-styled">
                {messages.map(m => (
                  <div key={m.id} className={`msg-wrapper ${m.senderId === user.uid ? "mine" : "theirs"}`}>
                    <div className={`msg-bubble ${m.type !== "text" ? "content-bubble" : ""}`}>
                      {m.type === "question" ? (
                        <div className={`shared-card question-card ${m.senderId !== user.uid && !m.metadata?.isSolved ? "clickable" : ""}`} onClick={() => handleQuestionClick(m)}>
                          <div className="card-badge">{m.metadata?.isSolved ? "✅ ÇÖZÜLDÜ" : "KELİME SORUSU"}</div>
                          <div className="card-main-text">{m.text}</div>
                          {!m.metadata?.isSolved && m.senderId !== user.uid && <div className="card-action">Çözmek için dokun</div>}
                        </div>
                      ) : m.type === "reading" ? (
                        <div className="shared-card reading-card clickable" onClick={() => handleReadingClick(m)}>
                          <div className="card-badge">OKUMA PARÇASI</div>
                          <div className="card-title">{m.metadata?.title}</div>
                          <div className="card-preview">{m.text}</div>
                          <div className="card-action">Tamamını Oku</div>
                        </div>
                      ) : (
                        <div className="msg-text-box">
                          <div className="msg-text">{m.text}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-bar glass-card" onSubmit={handleSendMessage}>
                <input name="msg" placeholder="Mesaj yaz..." autoComplete="off" />
                <button type="submit"><i className="fa-solid fa-paper-plane"></i></button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Soru Çözme Pop-up */}
      {solvingQuestion && (
        <div className="solution-modal-overlay" onClick={() => setSolvingQuestion(null)}>
          <div className="solution-modal glass-card animate-pop" onClick={e => e.stopPropagation()}>
            <button className="sol-close-floating" onClick={() => setSolvingQuestion(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="sol-header">
              <span className="sol-label">BU KELİMEYİ BİLİYOR MUSUN?</span>
            </div>
            <div className="sol-body">
              <div className="sol-word">{solvingQuestion.word}</div>
              <div className="sol-form">
                <div className="sol-input-wrapper">
                  <input className="sol-main-input" placeholder="Türkçe karşılığını yaz..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && checkSolution()} autoFocus disabled={solvedStatus === "correct"} />
                </div>
                <button className="sol-submit-btn" onClick={checkSolution} disabled={solvedStatus === "correct" || !inputValue.trim()}>
                  <i className="fa-solid fa-paper-plane"></i> Cevabı Gönder
                </button>
              </div>
              {solvedStatus && (
                <div className={`sol-feedback-box ${solvedStatus} animate-pop`}>
                  <div className="feedback-icon"><i className={`fa-solid ${solvedStatus === "correct" ? "fa-circle-check" : "fa-circle-xmark"}`}></i></div>
                  <div className="feedback-text">{solvedStatus === "correct" ? "Tebrikler! Doğru cevap sohbete iletildi." : <span>Yanlış! Arkadaşın bunu biliyordu: <b>{solvingQuestion.meaning}</b></span>}</div>
                </div>
              )}
            </div>
            {solvedStatus === "correct" && <button className="sol-finish-btn" onClick={() => setSolvingQuestion(null)}>Kapat</button>}
          </div>
        </div>
      )}

      {selectedProfileId && <ProfileModal userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />}

      <style jsx>{`
        .chat-hub-container { position: fixed; bottom: 24px; right: 24px; z-index: 2000; }
        .chat-hub-trigger {
          width: 56px; height: 56px; border-radius: 20px; background: var(--accent); color: #000;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; box-shadow: 0 10px 30px rgba(226, 183, 20, 0.4); transition: all 0.3s ease;
        }
        .chat-hub-trigger:hover { transform: scale(1.05) translateY(-2px); box-shadow: 0 15px 35px rgba(226, 183, 20, 0.6); }
        
        .chat-hub-window {
          position: absolute; bottom: 75px; right: 0; width: 340px; height: 500px;
          display: flex; flex-direction: column; overflow: hidden;
          background: var(--bg-card); border: 1px solid var(--border);
          box-shadow: 0 25px 60px rgba(0,0,0,0.4); border-radius: 30px; backdrop-filter: blur(30px);
        }
        :global([data-theme='light']) .chat-hub-window {
          box-shadow: 0 25px 60px rgba(0,0,0,0.1);
        }

        .hub-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--glass); flex-shrink: 0; }
        .hub-tab { flex: 1; padding: 16px 10px; border: none; background: none; color: var(--text-muted); font-weight: 800; cursor: pointer; font-size: 0.75rem; position: relative; }
        .hub-tab.active { color: var(--accent); }
        .hub-tab.active::after { content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 3px; background: var(--accent); border-radius: 3px 3px 0 0; }
        
        .hub-content { flex: 1; overflow-y: auto; padding: 12px; }
        .scroll-styled::-webkit-scrollbar { width: 4px; }
        .scroll-styled::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .chat-item { 
          display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 20px; 
          cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 8px; background: var(--glass);
          position: relative; overflow: hidden; border: 1px solid transparent;
        }
        .chat-item:hover { background: var(--bg-elevated); transform: translateY(-2px); border-color: var(--border); }
        
        .friend-item-indicator { position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; background: var(--primary); border-radius: 0 4px 4px 0; opacity: 0.6; }
        .chat-item-avatar { width: 46px; height: 46px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; flex-shrink: 0; }
        .msg-av { background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }
        .friend-av { background: linear-gradient(135deg, var(--primary), #1a7a3a); color: white; }
        .req-av { background: linear-gradient(135deg, var(--accent), #b38f00); color: #000; }
        .search-av { background: var(--glass); color: var(--accent); border: 1px solid var(--border); }
        
        .chat-item-info { flex: 1; min-width: 0; }
        .chat-item-name { font-size: 0.95rem; font-weight: 800; color: var(--text); margin-bottom: 2px; }
        .chat-item-last { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 100%; }
        .chat-arrow { font-size: 0.7rem; color: var(--text-muted); opacity: 0.3; }

        .hub-search-bar { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; }
        .hub-search-bar i { color: var(--accent); font-size: 0.9rem; }
        .hub-search-bar input { background: none; border: none; color: var(--text); outline: none; flex: 1; font-size: 0.85rem; font-weight: 600; }
        .search-profile-btn { background: var(--glass); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 800; transition: 0.2s; }
        .search-profile-btn:hover { border-color: var(--accent); color: var(--accent); }
        .search-section-title { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 12px; padding-left: 4px; opacity: 0.8; }
        .search-view { display: flex; flex-direction: column; height: 100%; }
        .search-results-list { flex: 1; overflow-y: auto; padding-right: 4px; }
        .search-results-list::-webkit-scrollbar { width: 3px; }
        .search-results-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .chat-active-view { display: flex; flex-direction: column; height: 100%; position: relative; background: var(--bg-card); }
        .chat-window-header { padding: 12px 16px; display: flex; align-items: center; gap: 10px; z-index: 10; background: var(--glass); border-bottom: 1px solid var(--border); border-radius: 0; min-height: 64px; }
        .back-btn { width: 34px; height: 34px; border-radius: 12px; background: var(--glass); border: 1px solid var(--border); color: var(--text); cursor: pointer; transition: all 0.2s; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .header-user-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; cursor: pointer; }
        .header-avatar { width: 38px; height: 38px; border-radius: 12px; background: var(--bg-elevated); color: var(--text); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem; border: 1px solid var(--border); overflow: hidden; flex-shrink: 0; position: relative; }
        .header-avatar.role-premium { border-color: #ffd60a; }
        .header-avatar.role-admin { border-color: #ff453a; }
        .chat-header-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .header-name-group { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
        .header-name { font-size: 0.9rem; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .header-status { font-size: 0.6rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; }
        .mini-profile-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; font-size: 0.85rem; opacity: 0.5; transition: 0.2s; }
        .mini-profile-btn:hover { color: var(--accent); opacity: 1; transform: scale(1.1); }
        
        .clear-chat-btn {
          margin-left: auto; background: var(--glass); border: 1px solid var(--border); color: var(--text-muted);
          width: 32px; height: 32px; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .clear-chat-btn:hover { background: rgba(255, 69, 58, 0.1); color: #ff453a; border-color: rgba(255, 69, 58, 0.2); }

        .chat-messages { flex: 1; overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; }
        .msg-wrapper { display: flex; width: 100%; }
        .mine { justify-content: flex-end; }
        .theirs { justify-content: flex-start; }
        .msg-bubble { max-width: 85%; border-radius: 20px; font-size: 0.9rem; line-height: 1.5; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative; }
        .mine .msg-bubble { background: var(--accent); color: #000; border-bottom-right-radius: 4px; padding: 10px 16px; font-weight: 600; }
        .theirs .msg-bubble { background: var(--bg-elevated); border: 1px solid var(--border); border-bottom-left-radius: 4px; padding: 10px 16px; color: var(--text); }
        .content-bubble { padding: 0 !important; background: none !important; border: none !important; box-shadow: none !important; }

        .msg-text-box { max-height: 300px; overflow-y: auto; scrollbar-width: thin; }
        .msg-text-box::-webkit-scrollbar { width: 3px; }
        .msg-text-box::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .msg-text { word-break: break-word; white-space: pre-wrap; }

        .shared-card { padding: 16px; border-radius: 20px; min-width: 220px; max-width: 100%; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; transition: all 0.3s; }
        .shared-card.clickable { cursor: pointer; }
        .shared-card.clickable:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.2); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
        .question-card { background: linear-gradient(135deg, rgba(226, 183, 20, 0.15), rgba(0,0,0,0.6)); border-color: rgba(226, 183, 20, 0.3); }
        .reading-card { background: linear-gradient(135deg, rgba(48, 209, 88, 0.15), rgba(0,0,0,0.6)); border-color: rgba(48, 209, 88, 0.3); }
        .card-preview { font-size: 0.8rem; opacity: 0.7; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; max-height: 8.4em; margin-bottom: 12px; }
        .card-badge { font-size: 0.6rem; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px; opacity: 0.8; color: var(--accent); }
        .reading-card .card-badge { color: var(--primary); }
        .card-main-text { font-size: 1.3rem; font-weight: 900; margin-bottom: 12px; }
        .card-action { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; width: fit-content; }

        .chat-input-bar { margin: 12px; padding: 8px 12px; display: flex; gap: 10px; align-items: center; border-radius: 20px; background: var(--glass); border: 1px solid var(--border); transition: all 0.2s; }
        .chat-input-bar:focus-within { border-color: var(--accent); background: var(--bg-elevated); }
        .chat-input-bar input { flex: 1; background: none; border: none; color: var(--text); outline: none; font-size: 0.9rem; }
        .chat-input-bar button { width: 38px; height: 38px; border-radius: 12px; background: var(--accent); color: #000; border: none; cursor: pointer; transition: 0.2s; }

        .solution-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 30000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(20px); }
        .solution-modal { width: 100%; max-width: 400px; padding: 45px 35px; border-radius: 40px; background: rgba(30,30,30,0.85); border: 1px solid rgba(226, 183, 20, 0.3); box-shadow: 0 40px 100px rgba(0,0,0,0.6); text-align: center; position: relative; }
        .sol-close-floating { position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: var(--glass); border: 1px solid var(--border); color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10; }
        .sol-close-floating:hover { background: rgba(255, 69, 58, 0.2); color: #ff453a; border-color: rgba(255, 69, 58, 0.3); transform: rotate(90deg); }

        .sol-label { font-size: 0.75rem; font-weight: 900; color: var(--accent); letter-spacing: 2px; opacity: 0.8; }
        .sol-word { font-size: 3rem; font-weight: 900; color: #fff; margin: 30px 0; text-shadow: 0 0 20px rgba(255,255,255,0.1); }
        .sol-main-input { width: 100%; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; color: #fff; font-size: 1.2rem; text-align: center; outline: none; transition: all 0.3s; }
        .sol-main-input:focus { border-color: var(--accent); background: rgba(226, 183, 20, 0.08); }
        .sol-submit-btn { background: var(--accent); color: #000; border: none; border-radius: 20px; padding: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.3s; }
        .sol-submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(226, 183, 20, 0.4); }

        @media (max-width: 768px) {
          .chat-hub-container { bottom: 90px; right: 20px; }
          .chat-hub-window { width: calc(100vw - 40px); max-width: 340px; height: 480px; bottom: 70px; }
        }
      `}</style>
    </div>
  );
}
