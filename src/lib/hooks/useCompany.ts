"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, getDoc
} from "firebase/firestore";
import type { Company, Member, DiscussionThread, DiscussionMessage, Invoice } from "@/lib/types";

const COMPANY_ID = "main";

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "company", COMPANY_ID), (snap) => {
      if (snap.exists()) setCompany({ id: snap.id, ...snap.data() } as Company);
      else setCompany(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateCompany = async (data: Partial<Company>) => {
    await setDoc(doc(db, "company", COMPANY_ID), data, { merge: true });
  };

  return { company, loading, updateCompany };
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "members"), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member)));
    });
    return unsub;
  }, []);

  const addMember = (m: Omit<Member, "id">) => addDoc(collection(db, "members"), m);
  const updateMember = (id: string, data: Partial<Member>) => updateDoc(doc(db, "members", id), data);
  const deleteMember = (id: string) => deleteDoc(doc(db, "members", id));

  return { members, addMember, updateMember, deleteMember };
}

export function useThreads() {
  const [threads, setThreads] = useState<DiscussionThread[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "threads"), (snap) => {
      setThreads(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as DiscussionThread))
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      );
    });
    return unsub;
  }, []);

  const addThread = (t: Omit<DiscussionThread, "id">) => addDoc(collection(db, "threads"), t);
  const updateThread = (id: string, data: Partial<DiscussionThread>) => updateDoc(doc(db, "threads", id), data);
  const deleteThread = (id: string) => deleteDoc(doc(db, "threads", id));

  return { threads, addThread, updateThread, deleteThread };
}

export function useMessages(threadId: string) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);

  useEffect(() => {
    if (!threadId) return;
    const unsub = onSnapshot(collection(db, "threads", threadId, "messages"), (snap) => {
      setMessages(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as DiscussionMessage))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
    });
    return unsub;
  }, [threadId]);

  const addMessage = (m: Omit<DiscussionMessage, "id">) =>
    addDoc(collection(db, "threads", threadId, "messages"), m);

  return { messages, addMessage };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "invoices"), (snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice)));
    });
    return unsub;
  }, []);

  const addInvoice = (inv: Omit<Invoice, "id">) => addDoc(collection(db, "invoices"), inv);
  const updateInvoice = (id: string, data: Partial<Invoice>) => updateDoc(doc(db, "invoices", id), data);
  const deleteInvoice = (id: string) => deleteDoc(doc(db, "invoices", id));

  return { invoices, addInvoice, updateInvoice, deleteInvoice };
}
