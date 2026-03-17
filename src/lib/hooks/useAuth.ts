"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, User
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Member } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u?.email) {
        const q = query(collection(db, "members"), where("email", "==", u.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setMember({ id: snap.docs[0].id, ...snap.docs[0].data() } as Member);
        }
      } else {
        setMember(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return { user, member, loading, login, register, logout };
}
