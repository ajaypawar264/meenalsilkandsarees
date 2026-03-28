import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAX22tamSoAJPIIoSDqKTS4H5FZh3SG3Xc",
  authDomain: "minal-silk-and-saree.firebaseapp.com",
  projectId: "minal-silk-and-saree",
  storageBucket: "minal-silk-and-saree.firebasestorage.app",
  messagingSenderId: "126939560081",
  appId: "1:126939560081:web:e85acf9ebd2fbe7ff52730",
  measurementId: "G-VM4DXSCBJ9",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;