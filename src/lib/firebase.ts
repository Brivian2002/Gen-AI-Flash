import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import firebaseConfigJSON from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfigJSON);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigJSON.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // First sign up - give generous initial credits
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        credits: 1000000, // 1 Million free credits
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const deductCredit = async (userId: string) => {
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    credits: increment(-1),
    updatedAt: new Date().toISOString()
  });
};

export const saveSearch = async (userId: string, queryText: string, result: string) => {
  await addDoc(collection(db, "searches"), {
    userId,
    query: queryText,
    response: result,
    timestamp: new Date().toISOString()
  });
};

export const getSearchHistory = async (userId: string) => {
  const q = query(
    collection(db, "searches"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(20)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
