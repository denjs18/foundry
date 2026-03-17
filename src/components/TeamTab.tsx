"use client";
import { useState } from "react";
import { useMembers } from "@/lib/hooks/useCompany";
import { Plus, Trash2, Pencil, Github, Mail, Users } from "lucide-react";
import toast from "react-hot-toast";
import type { Member, MemberRole } from "@/lib/types";

const ROLES: MemberRole[] = [
  "Founder", "Co-Founder", "CEO", "CTO", "CFO",
  "Communication", "Technical", "Marketing",
  "Design", "Sales", "Legal", "Operations", "Advisor", "Intern"
];

const ROLE_COLORS: Record<string, string> = {
  Founder: "bg-yellow-900 text-yellow-300",
  "Co-Founder": "bg-yellow-900 text-yellow-300",
  CEO: "bg-purple-900 text-purple-300",
  CTO: "bg-blue-900 text-blue-300",
  CFO: "bg-green-900 text-green-300",
  Communication: "bg-pink-900 text-pink-300",
  Technical: "bg-cyan-900 text-cyan-300",
  Marketing: "bg-orange-900 text-orange-300",
  Design: "bg-rose-900 text-rose-300",
  Sales: "bg-emerald-900 text-emerald-300",
  Legal: "bg-slate-700 text-slate-300",
  Operations: "bg-indigo-900 text-indigo-300",
  Advisor: "bg-amber-900 text-amber-300",
  Intern: "bg-gray-700 text-gray-300",
};

type MemberForm = {
  name: string;
  roles: MemberRole[];
  email: string;
  githubUrl: string;
  joinedAt: string;
};

const emptyMember = (): MemberForm => ({
  name: "", roles: ["Technical"], email: "", githubUrl: "", joinedAt: new Date().toISOString()
});

export default function TeamTab() {
  const { members, addMember, updateMember, deleteMember } = useMembers();
  const [modal, setModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [form, setForm] = useState<MemberForm>(emptyMember());

  const openAdd = () => { setForm(emptyMember()); setModal({ open: true }); };
  const openEdit = (m: Member) => {
    setForm({
      name: m.name,
      roles: (m as any).roles || ["Technical"],
      email: m.email || "",
      githubUrl: m.githubUrl || "",
      joinedAt: m.joinedAt
    });
    setModal({ open: true, member: m });
  };

  const toggleRole = (r: MemberRole) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r]
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nom requis");
    if (form.roles.length === 0) return toast.error("Au moins un rôle requis");
    const data = { ...form, role: form.roles[0] };
    if (modal.member) {
      await updateMember(modal.member.id, data);
      toast.success("Membre mis à jour");
    } else {
      await addMember(data as any);
      toast.success("Membre ajouté !");
    }
    setModal({ open: false });
  };

  const remove = async (id: string) => {
    await deleteMember(id);
    toast.success("Membre supprimé");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <Users className="w-5 h-5" />
          <span className="text-sm">{members.length} membre{members.length > 1 ? "s" : ""}</span>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Ajouter un membre
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const roles = (m as any).roles || ["Technical"];
          return (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(m.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-semibold text-white">{m.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {roles.map((r: string) => (
                    <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r] || "bg-gray-700 text-gray-300"}`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                {m.email && (
                  <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-xs text-gray-400 hover:text-sky-400 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" /> {m.email}
                  </a>
                )}
                {m.githubUrl && (
                  <a href={m.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-400 truncate">
                    <Github className="w-3 h-3 flex-shrink-0" /> {m.githubUrl.replace("https://github.com/", "@")}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false })}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">{modal.member ? "Modifier" : "Ajouter"} un membre</h2>

            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nom complet *" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Rôles (sélection multiple)</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button key={r} type="button" onClick={() => toggleRole(r)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      form.roles.includes(r)
                        ? "bg-sky-600 border-sky-500 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-400"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />

            <input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
              placeholder="https://github.com/username" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />

            <div className="flex gap-3">
              <button onClick={save} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg py-2 text-sm font-medium">
                {modal.member ? "Mettre à jour" : "Ajouter"}
              </button>
              <button onClick={() => setModal({ open: false })} className="flex-1 bg-gray-800 text-gray-300 rounded-lg py-2 text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
