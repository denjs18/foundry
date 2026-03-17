"use client";
import { useState } from "react";
import { useThreads, useMessages } from "@/lib/hooks/useCompany";
import {
  Plus, Pin, Trash2, MessageSquare, Lightbulb, Bug, FlaskConical, CheckCircle2, Hash, Send, ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { DiscussionThread, DiscussionMessage } from "@/lib/types";

const MSG_TYPES = [
  { id: "message", label: "Message", icon: MessageSquare, color: "text-gray-400" },
  { id: "idea", label: "Idée", icon: Lightbulb, color: "text-yellow-400" },
  { id: "test", label: "Test en cours", icon: FlaskConical, color: "text-purple-400" },
  { id: "bug", label: "Bug", icon: Bug, color: "text-red-400" },
  { id: "decision", label: "Décision", icon: CheckCircle2, color: "text-green-400" },
];

const CATEGORIES = ["tech", "product", "marketing", "legal", "general"] as const;

function MessageBubble({ msg }: { msg: DiscussionMessage }) {
  const typeInfo = MSG_TYPES.find((t) => t.id === msg.type) || MSG_TYPES[0];
  const Icon = typeInfo.icon;
  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
        {msg.author.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{msg.author}</span>
          <span className="text-xs text-gray-500">{msg.authorRole}</span>
          <span className={`flex items-center gap-1 text-xs ${typeInfo.color}`}>
            <Icon className="w-3 h-3" /> {typeInfo.label}
          </span>
          <span className="text-xs text-gray-600 ml-auto">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
      </div>
    </div>
  );
}

function ThreadView({ thread, onBack }: { thread: DiscussionThread; onBack: () => void }) {
  const { messages, addMessage } = useMessages(thread.id);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [authorRole, setAuthorRole] = useState("Technical");
  const [type, setType] = useState<DiscussionMessage["type"]>("message");

  const send = async () => {
    if (!content.trim() || !author.trim()) return toast.error("Auteur et contenu requis");
    await addMessage({ threadId: thread.id, author, authorRole, content, type, createdAt: new Date().toISOString(), reactions: {} });
    setContent("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-white">{thread.title}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{thread.category}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-gray-900 rounded-xl p-4 border border-gray-800">
        {messages.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8">Aucun message. Soyez le premier à écrire !</p>
        )}
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input value={author} onChange={(e) => setAuthor(e.target.value)}
            placeholder="Votre nom" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input value={authorRole} onChange={(e) => setAuthorRole(e.target.value)}
            placeholder="Rôle" className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {MSG_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setType(t.id as DiscussionMessage["type"])}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                  type === t.id ? "border-sky-500 bg-sky-900/30 text-sky-300" : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}>
                <Icon className="w-3 h-3" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) send(); }}
            placeholder="Votre message... (Ctrl+Entrée pour envoyer)"
            rows={2}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <button onClick={send} className="bg-sky-600 hover:bg-sky-500 text-white px-4 rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TechTab() {
  const { threads, addThread, updateThread, deleteThread } = useThreads();
  const [activeThread, setActiveThread] = useState<DiscussionThread | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<DiscussionThread["category"]>("tech");

  const createThread = async () => {
    if (!newTitle.trim()) return;
    await addThread({
      title: newTitle, category: newCategory, pinned: false,
      createdAt: new Date().toISOString(), lastActivity: new Date().toISOString(), messageCount: 0
    });
    setNewTitle(""); setShowNew(false);
    toast.success("Discussion créée !");
  };

  if (activeThread) return <ThreadView thread={activeThread} onBack={() => setActiveThread(null)} />;

  const pinned = threads.filter((t) => t.pinned);
  const unpinned = threads.filter((t) => !t.pinned);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Discussions techniques</h2>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvelle discussion
        </button>
      </div>

      {showNew && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre de la discussion" autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as DiscussionThread["category"])}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={createThread} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm">Créer</button>
            <button onClick={() => setShowNew(false)} className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
            <Pin className="w-3 h-3" /> Épinglés
          </p>
          {pinned.map((t) => <ThreadCard key={t.id} thread={t} onOpen={setActiveThread} onUpdate={updateThread} onDelete={deleteThread} />)}
        </div>
      )}

      <div className="space-y-2">
        {unpinned.length === 0 && pinned.length === 0 && (
          <p className="text-center text-gray-600 py-12">Aucune discussion. Créez-en une !</p>
        )}
        {unpinned.map((t) => <ThreadCard key={t.id} thread={t} onOpen={setActiveThread} onUpdate={updateThread} onDelete={deleteThread} />)}
      </div>
    </div>
  );
}

function ThreadCard({ thread, onOpen, onUpdate, onDelete }: {
  thread: DiscussionThread;
  onOpen: (t: DiscussionThread) => void;
  onUpdate: (id: string, data: Partial<DiscussionThread>) => void;
  onDelete: (id: string) => void;
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    tech: "bg-blue-900 text-blue-300", product: "bg-purple-900 text-purple-300",
    marketing: "bg-orange-900 text-orange-300", legal: "bg-gray-700 text-gray-300",
    general: "bg-green-900 text-green-300",
  };

  return (
    <div onClick={() => onOpen(thread)}
      className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-3 cursor-pointer group transition-colors">
      <Hash className="w-4 h-4 text-gray-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm truncate">{thread.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[thread.category]}`}>{thread.category}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Dernière activité {formatDistanceToNow(new Date(thread.lastActivity), { addSuffix: true, locale: fr })}
        </p>
      </div>
      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onUpdate(thread.id, { pinned: !thread.pinned })}
          className={`${thread.pinned ? "text-sky-400" : "text-gray-600 hover:text-gray-400"}`}>
          <Pin className="w-4 h-4" />
        </button>
        <button onClick={() => { onDelete(thread.id); toast.success("Discussion supprimée"); }}
          className="text-gray-600 hover:text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
        <MessageSquare className="w-3 h-3" /> {thread.messageCount}
      </div>
    </div>
  );
}
