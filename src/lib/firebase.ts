import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMVmWK63oIwTFGbFlk83CXElw8RCN7HKY",
  authDomain: "data-zone-ghana.firebaseapp.com",
  projectId: "data-zone-ghana",
  storageBucket: "data-zone-ghana.firebasestorage.app",
  messagingSenderId: "646703313086",
  appId: "1:646703313086:web:941679243ebd44fb0a2eef",
  measurementId: "G-XYRRGDZ6RS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
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
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log("Creating user doc for migration:", userId);
      await setDoc(userDocRef, {
        uid: userId,
        credits: 1000000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return;
    }

    await updateDoc(userDocRef, {
      credits: increment(-1),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn("Deduction process bypassed (Firestore Rules/Missing Doc):", error);
  }
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
