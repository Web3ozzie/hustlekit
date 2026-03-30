import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFp9gXu0Pb-UopmaEgcx-hP3iFIsFfdFk",
  authDomain: "hustle-kit.firebaseapp.com",
  projectId: "hustle-kit",
  storageBucket: "hustle-kit.firebasestorage.app",
  messagingSenderId: "665118548608",
  appId: "1:665118548608:web:df3e6795864c8b50d2fc65"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); //