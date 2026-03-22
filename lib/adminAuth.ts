import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function adminLogin(email: string, password: string) {
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error("Email and password required");
  }

  const adminsRef = collection(db, "admin");
  const q = query(adminsRef, where("email", "==", cleanEmail), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid admin email");
  }

  const adminDoc = snapshot.docs[0];
  const adminData = adminDoc.data();

  const savedPassword = String(adminData.password || "").trim();

  if (savedPassword !== cleanPassword) {
    throw new Error("Incorrect admin password");
  }

  return {
    id: adminDoc.id,
    email: String(adminData.email || ""),
    name: String(adminData.name || "Admin"),
  };
}

export async function adminLogout() {
  try {
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_name");
  } catch (error) {
    console.error("Logout error:", error);
  }
}