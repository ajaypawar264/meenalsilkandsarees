import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAX22tamSoAJPIIoSDqKTS4H5FZh3SG3Xc",
  authDomain: "minal-silk-and-saree.firebaseapp.com",
  projectId: "minal-silk-and-saree",
  storageBucket: "minal-silk-and-saree.appspot.com",
  messagingSenderId: "126939560081",
  appId: "1:126939560081:web:e85acf9ebd2fbe7ff52730",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;