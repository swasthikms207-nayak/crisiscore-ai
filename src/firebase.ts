// firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBpn4SfPepWgr897_1Ka94ALy7kgXddt7k",
  authDomain: "crisiscore-ai.firebaseapp.com",
  projectId: "crisiscore-ai",
  storageBucket: "crisiscore-ai.firebasestorage.app",
  messagingSenderId: "384309879868",
  appId: "1:384309879868:web:5c13a7615d85d4a6be0f39",

  databaseURL:
    "https://crisiscore-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const rtdb = getDatabase(app);