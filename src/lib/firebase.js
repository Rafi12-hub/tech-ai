import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyADysCuhZGVhUAmO_ReJQE2MoIpIe8RniM",
  authDomain: "gitam-3395d.firebaseapp.com",
  projectId: "gitam-3395d",
  storageBucket: "gitam-3395d.firebasestorage.app",
  messagingSenderId: "240578710691",
  appId: "1:240578710691:web:cb2e027aec8a42fda44316",
  measurementId: "G-79RVTCHDWR"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
