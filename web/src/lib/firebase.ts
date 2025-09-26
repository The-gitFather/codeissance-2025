import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "nfc3-git-push--f-657a0.firebaseapp.com",
  projectId: "nfc3-git-push--f-657a0",
  storageBucket: "nfc3-git-push--f-657a0.appspot.com",
  messagingSenderId: "993592589857",
  appId: "1:993592589857:web:d62ac70839dbe34bd3ed60",
  measurementId: "G-7DLPTX0HJP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);