import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  writeBatch, increment, onSnapshot, arrayUnion, addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ===== KULLANICI KELİME BANKASI =====

export async function getUserWords(uid) {
  const wordsRef = collection(db, "users", uid, "words");
  const snapshot = await getDocs(wordsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function subscribeToUserWords(uid, callback) {
  const wordsRef = collection(db, "users", uid, "words");
  return onSnapshot(wordsRef, (snapshot) => {
    const words = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(words);
  });
}

export async function addUserWord(uid, wordData) {
  const wordId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const wordRef = doc(db, "users", uid, "words", wordId);
  await setDoc(wordRef, {
    ...wordData,
    level: 0,
    nextReview: Date.now(),
    correctCount: 0,
    wrongCount: 0,
    addedDate: serverTimestamp(),
  });
  return wordId;
}

export async function updateUserWord(uid, wordId, updates) {
  const wordRef = doc(db, "users", uid, "words", wordId);
  await updateDoc(wordRef, updates);
}

export async function deleteUserWord(uid, wordId) {
  const wordRef = doc(db, "users", uid, "words", wordId);
  await deleteDoc(wordRef);
}

// ===== KULLANICI İSTATİSTİKLERİ =====

export async function getUserStats(uid) {
  const statsRef = doc(db, "users", uid, "data", "stats");
  const snap = await getDoc(statsRef);
  if (!snap.exists()) {
    const defaults = {
      streak: 0, lastDate: "",
      dailyMinutes: 0, correct: 0, wrong: 0,
      lastTestTime: 0
    };
    await setDoc(statsRef, defaults);
    return defaults;
  }
  return snap.data();
}

export async function refreshUserStreak(uid) {
  const statsRef = doc(db, "users", uid, "data", "stats");
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(statsRef);
  
  const today = new Date().toLocaleDateString('tr-TR');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('tr-TR');
  
  let currentStats = snap.exists() ? snap.data() : { streak: 0, lastDate: "" };
  let { streak, lastDate } = currentStats;

  if (lastDate === today) return streak; // Zaten bugün güncellendi

  if (lastDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  await updateDoc(statsRef, { streak, lastDate: today });
  
  // Liderlik tablosu için user dökümanına da yansıt (publicStats)
  await updateDoc(userRef, { 
    "publicStats.streak": streak,
    "publicStats.lastSeen": serverTimestamp()
  });

  return streak;
}

export async function updateUserStats(uid, stats) {
  const statsRef = doc(db, "users", uid, "data", "stats");
  const userRef = doc(db, "users", uid);
  
  const updateData = {};
  if (stats.correct !== undefined) updateData.correct = increment(stats.correct);
  if (stats.wrong !== undefined) updateData.wrong = increment(stats.wrong);
  if (stats.streak !== undefined) updateData.streak = stats.streak; 
  if (stats.lastTestTime !== undefined) updateData.lastTestTime = stats.lastTestTime;
  
  await setDoc(statsRef, updateData, { merge: true });

  // Public stats güncelleme (Leaderboard için)
  const newStats = (await getDoc(statsRef)).data();
  const words = await getUserWords(uid);
  const totalWords = words.length;
  const masteryCount = words.filter(w => (w.level || 0) >= 4).length;
  const level1Count = words.filter(w => w.level === 1).length;
  const level2Count = words.filter(w => w.level === 2).length;
  const level3Count = words.filter(w => w.level === 3).length;

  await updateDoc(userRef, {
    "publicStats.totalWords": totalWords,
    "publicStats.masteryCount": masteryCount,
    "publicStats.weeklyMinutes": newStats.weeklyMinutes || 0,
    "publicStats.streak": newStats.streak || 0,
    "publicStats.correct": newStats.correct || 0,
    "publicStats.wrong": newStats.wrong || 0,
    "publicStats.lastTestTime": stats.lastTestTime || 0
  });
}

export async function incrementStudyMinutes(uid, minutes) {
  const statsRef = doc(db, "users", uid, "data", "stats");
  const userRef = doc(db, "users", uid);
  
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  
  const snap = await getDoc(statsRef);
  const data = snap.exists() ? snap.data() : {};
  
  let weeklyMinutes = data.weeklyMinutes || 0;
  if (data.lastWeekNumber !== weekNumber) {
    weeklyMinutes = minutes;
  } else {
    weeklyMinutes += minutes;
  }

  await updateDoc(statsRef, { 
    dailyMinutes: increment(minutes),
    weeklyMinutes: weeklyMinutes,
    lastWeekNumber: weekNumber
  });

  await updateDoc(userRef, { 
    "publicStats.totalMinutes": increment(minutes),
    "publicStats.weeklyMinutes": weeklyMinutes
  });
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

// ===== KULLANICI HATALARI =====

export async function getUserMistakes(uid) {
  const mistakesRef = doc(db, "users", uid, "data", "mistakes");
  const snap = await getDoc(mistakesRef);
  return snap.exists() ? snap.data().wrongIds || [] : [];
}

export async function updateUserMistakes(uid, wrongIds) {
  const mistakesRef = doc(db, "users", uid, "data", "mistakes");
  await setDoc(mistakesRef, { wrongIds }, { merge: true });
}

// ===== HERO İLERLEME =====

export async function getUserHeroStats(uid) {
  const heroRef = doc(db, "users", uid, "data", "hero");
  const snap = await getDoc(heroRef);
  if (!snap.exists()) {
    const defaults = {
      levels: {
        A1: { completed: 0, required: 10, unlocked: true, next: "A2" },
        A2: { completed: 0, required: 15, unlocked: false, next: "B1" },
        B1: { completed: 0, required: 20, unlocked: false, next: "B2" },
        B2: { completed: 0, required: 25, unlocked: false, next: "C1" },
        C1: { completed: 0, required: 30, unlocked: false, next: null },
      },
      heroWords: [],
    };
    await setDoc(heroRef, defaults);
    return defaults;
  }
  return snap.data();
}

export async function updateUserHeroStats(uid, heroData) {
  const heroRef = doc(db, "users", uid, "data", "hero");
  await setDoc(heroRef, heroData, { merge: true });
}

// ===== ARŞİV (GLOBAL SÖZLÜK — ADMİN YÖNETİR) =====

export async function getArchiveWords(pageSize = 50, lastDoc = null) {
  const archiveRef = collection(db, "archive");
  let q = query(archiveRef, orderBy("word"), limit(pageSize));
  if (lastDoc) q = query(archiveRef, orderBy("word"), startAfter(lastDoc), limit(pageSize));
  const snapshot = await getDocs(q);
  return {
    words: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
}

export async function getArchiveWordsByLevel(level) {
  const archiveRef = collection(db, "archive");
  const q = query(archiveRef, where("level", "==", level), orderBy("word"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function searchArchiveWords(searchTerm, level = null) {
  const archiveRef = collection(db, "archive");
  let q;
  if (level) {
    q = query(archiveRef, where("level", "==", level));
  } else {
    q = query(archiveRef);
  }
  const snapshot = await getDocs(q);
  const term = searchTerm.toLowerCase();
  
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(w => {
      const word = (w.word || w.phrase || "").toLowerCase();
      const meaning = (w.meaning || "").toLowerCase();
      return word.includes(term) || meaning.includes(term);
    });

  // Sıralama Önceliği: 
  // 1. İngilizcesi terimle başlayanlar
  // 2. Türkçesi terimle başlayanlar
  // 3. Diğerleri
  return results.sort((a, b) => {
    const aWord = (a.word || a.phrase || "").toLowerCase();
    const aMeaning = (a.meaning || "").toLowerCase();
    const bWord = (b.word || b.phrase || "").toLowerCase();
    const bMeaning = (b.meaning || "").toLowerCase();

    const aStartsEn = aWord.startsWith(term);
    const bStartsEn = bWord.startsWith(term);
    if (aStartsEn && !bStartsEn) return -1;
    if (!aStartsEn && bStartsEn) return 1;

    const aStartsTr = aMeaning.startsWith(term);
    const bStartsTr = bMeaning.startsWith(term);
    if (aStartsTr && !bStartsTr) return -1;
    if (!aStartsTr && bStartsTr) return 1;

    return aWord.localeCompare(bWord);
  });
}

// ===== PHRASAL VERBS =====

export async function getPhrasalVerbs() {
  const pvRef = collection(db, "phrasalVerbs");
  const snapshot = await getDocs(pvRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== GRAMER KONULARI =====

export async function getGrammarTopics() {
  const grammarRef = collection(db, "grammarTopics");
  const q = query(grammarRef, orderBy("sortOrder"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== ADMIN FONKSİYONLARI =====

export async function addArchiveWord(wordData) {
  const wordId = wordData.word.toLowerCase().replace(/\s+/g, "_");
  const wordRef = doc(db, "archive", wordId);
  await setDoc(wordRef, { ...wordData, createdAt: serverTimestamp() });
  return wordId;
}

export async function updateArchiveWord(wordId, updates) {
  const wordRef = doc(db, "archive", wordId);
  await updateDoc(wordRef, updates);
}

export async function deleteArchiveWord(wordId) {
  const wordRef = doc(db, "archive", wordId);
  await deleteDoc(wordRef);
}

export async function getAllUsers() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getLeaderboard(category = "streak", limitCount = 10) {
  const usersRef = collection(db, "users");
  const field = `publicStats.${category}`;
  const q = query(
    usersRef, 
    where(field, ">", 0), 
    orderBy(field, "desc"), 
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateUserRole(uid, role) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role });
}

export async function updateLastReminderDate(uid) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { lastReminderDate: new Date().toDateString() });
}

export async function addGrammarTopic(topicData) {
  const topicId = `grammar_${Date.now()}`;
  const topicRef = doc(db, "grammarTopics", topicId);
  await setDoc(topicRef, { ...topicData, createdAt: serverTimestamp() });
  return topicId;
}

export async function updateGrammarTopic(topicId, updates) {
  const topicRef = doc(db, "grammarTopics", topicId);
  await updateDoc(topicRef, updates);
}

export async function deleteGrammarTopic(topicId) {
  const topicRef = doc(db, "grammarTopics", topicId);
  await deleteDoc(topicRef);
}

// ===== TOPLU VERİ YÜKLEME (SEED) =====

export async function batchAddArchiveWords(wordsArray) {
  const batchSize = 500;
  for (let i = 0; i < wordsArray.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = wordsArray.slice(i, i + batchSize);
    chunk.forEach(word => {
      const wordId = (word.word || word.phrase || "").toLowerCase().replace(/\s+/g, "_");
      if (wordId) {
        const ref = doc(db, "archive", wordId);
        batch.set(ref, word);
      }
    });
    await batch.commit();
  }
}

export async function batchAddPhrasalVerbs(verbsArray) {
  const batchSize = 500;
  for (let i = 0; i < verbsArray.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = verbsArray.slice(i, i + batchSize);
    chunk.forEach(verb => {
      const verbId = (verb.phrase || verb.word || "").toLowerCase().replace(/\s+/g, "_");
      if (verbId) {
        const ref = doc(db, "phrasalVerbs", verbId);
        batch.set(ref, verb);
      }
    });
    await batch.commit();
  }
}

export async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  const batchSize = 500;
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(i, i + batchSize);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function updateFcmToken(uid, token) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { fcmToken: token, lastTokenUpdate: serverTimestamp() }, { merge: true });
}

// ===== AI CHAT MEMORY =====

export async function saveAIMessage(uid, message) {
  const chatRef = collection(db, "users", uid, "ai_messages");
  const msgId = `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  await setDoc(doc(chatRef, msgId), {
    ...message,
    timestamp: serverTimestamp()
  });
}

export async function getAIMessages(uid, limitCount = 20) {
  const chatRef = collection(db, "users", uid, "ai_messages");
  const q = query(chatRef, orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data()).reverse();
}
export async function clearAIChat(uid) {
  const chatRef = collection(db, "users", uid, "ai_messages");
  const snapshot = await getDocs(chatRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}
// =============================================
// SOCIAL & MESSAGING
// =============================================

export async function searchUsers(queryText) {
  if (!queryText || queryText.trim() === "") {
    // Boş aramada en son kayıt olanları getir
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  const term = queryText.toLowerCase().trim();
  const q = query(
    collection(db, "users"),
    where("searchName", ">=", term),
    where("searchName", "<=", term + "\uf8ff"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function sendFriendRequest(fromUid, toUid) {
  const requestId = [fromUid, toUid].sort().join("_");
  const requestRef = doc(db, "friendRequests", requestId);
  await setDoc(requestRef, {
    from: fromUid,
    to: toUid,
    status: "pending",
    timestamp: serverTimestamp()
  });
}

export async function respondToFriendRequest(requestId, status, fromUid, toUid) {
  const requestRef = doc(db, "friendRequests", requestId);
  if (status === "accepted") {
    // Her iki kullanıcının arkadaş listesini güncelle
    const fromRef = doc(db, "users", fromUid, "data", "social");
    const toRef = doc(db, "users", toUid, "data", "social");

    await setDoc(fromRef, { friends: arrayUnion(toUid) }, { merge: true });
    await setDoc(toRef, { friends: arrayUnion(fromUid) }, { merge: true });
    await updateDoc(requestRef, { status: "accepted" });
  } else {
    await deleteDoc(requestRef);
  }
}

export async function getFriends(uid) {
  const socialRef = doc(db, "users", uid, "data", "social");
  const snap = await getDoc(socialRef);
  if (!snap.exists()) return [];
  const friendIds = snap.data().friends || [];
  
  // Arkadaşların profil bilgilerini çek
  const friends = [];
  for (const fId of friendIds) {
    const uDoc = await getDoc(doc(db, "users", fId));
    if (uDoc.exists()) friends.push({ id: fId, ...uDoc.data() });
  }
  return friends;
}

export async function getOrCreateChat(uid1, uid2) {
  const chatId = [uid1, uid2].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  
  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [uid1, uid2],
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastTimestamp: serverTimestamp()
    });
  }
  return chatId;
}

export async function sendMessage(chatId, senderUid, text, type = "text", metadata = {}) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId: senderUid,
    text,
    type,
    metadata,
    timestamp: serverTimestamp()
  });
  
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    lastTimestamp: serverTimestamp()
  });
}

export async function checkAndGrantBadges(uid, stats, wordsCount, heroLevels) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return [];
  
  const currentBadges = userSnap.data().badges || [];
  const newBadges = [...currentBadges];
  let changed = false;

  const grant = (badgeId) => {
    if (!newBadges.includes(badgeId)) {
      newBadges.push(badgeId);
      changed = true;
    }
  };

  // 1. Streak Rozetleri
  if (stats.streak >= 7) grant("STREAK_7");
  if (stats.streak >= 30) grant("STREAK_30");

  // 2. Kelime Rozetleri
  if (wordsCount >= 100) grant("WORDS_100");
  if (wordsCount >= 500) grant("WORDS_500");

  // 3. Zaman Rozetleri
  const hour = new Date().getHours();
  if (hour >= 0 && hour <= 4) grant("NIGHT_OWL");
  if (hour >= 5 && hour <= 8) grant("EARLY_BIRD");

  // 4. Hero Seviyeleri
  if (heroLevels?.A1?.completed >= 10) grant("HERO_A1");

  if (changed) {
    await updateDoc(userRef, { badges: newBadges });
    return newBadges;
  }
  return currentBadges;
}
