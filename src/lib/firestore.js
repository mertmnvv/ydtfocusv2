import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  writeBatch, increment, onSnapshot
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
      streak: 0, lastDate: "", streakDate: "",
      dailyMinutes: 0, todayInitialReview: 0,
    };
    await setDoc(statsRef, defaults);
    return defaults;
  }
  return snap.data();
}

export async function updateUserStats(uid, stats) {
  const statsRef = doc(db, "users", uid, "data", "stats");
  const updateData = {};
  if (stats.correct !== undefined) updateData.correct = increment(stats.correct);
  if (stats.wrong !== undefined) updateData.wrong = increment(stats.wrong);
  if (stats.streak !== undefined) updateData.streak = stats.streak; 
  
  await setDoc(statsRef, updateData, { merge: true });
}

export async function incrementStudyMinutes(uid, minutes) {
  const statsRef = doc(db, "users", uid, "data", "stats");
  await updateDoc(statsRef, { dailyMinutes: increment(minutes) });
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
