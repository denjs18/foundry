"use client";
import { useState } from "react";
import { useCompany } from "@/lib/hooks/useCompany";
import { Pencil, Globe, Github, Plus, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { CompanyStatus } from "@/lib/types";

const STATUSES: CompanyStatus[] = [
  "auto-entrepreneur", "micro-entreprise", "EURL", "SASU", "SARL", "SAS", "SA", "SCI", "Association"
];

export default function CompanyHeader() {
  const { company, updateCompany } = useCompany();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", status: "auto-entrepreneur" as CompanyStatus, siret: "", websites: [""], githubRepos: [""] });

  const openEdit = () => {
    setForm({
      name: company?.name || "",
      status: company?.status || "auto-entrepreneur",
      siret: company?.siret || "",
      websites: company?.websites?.length ? company.websites : [""],
      githubRepos: company?.githubRepos?.length ? company.githubRepos : [""],
    });
    setEditing(true);
  };

  const save = async () => {
    await updateCompany({
      ...form,
      websites: form.websites.filter(Boolean),
      githubRepos: form.githubRepos.filter(Boolean),
      createdAt: company?.createdAt || new Date().toISOString(),
    });
    setEditing(false);
    toast.success("Entreprise mise à jour !");
  };

  const addUrl = (field: "websites" | "githubRepos") =>
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));

  const removeUrl = (field: "websites" | "githubRepos", i: number) =>
    setForm((f) => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));

  const updateUrl = (field: "websites" | "githubRepos", i: number, val: string) =>
    setForm((f) => {
      const arr = [...f[field]];
      arr[i] = val;
      return { ...f, [field]: arr };
    });

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-5">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{company?.name || "Mon Entreprise"}</h1>
            {company?.status && (
              <span className="text-xs px-2 py-1 rounded-full bg-sky-900 text-sky-300 font-medium">{company.status}</span>
            )}
            {company?.siret && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> SIRET : {company.siret}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {company?.websites?.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-sky-400 hover:underline">
                <Globe className="w-3 h-3" /> {url}
              </a>
            ))}
            {company?.githubRepos?.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-400 hover:underline">
                <Github className="w-3 h-3" /> {url.replace("https://github.com/", "")}
              </a>
            ))}
          </div>
        </div>
        <button onClick={openEdit}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
          <Pencil className="w-4 h-4" /> Modifier
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">Paramètres de l'entreprise</h2>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nom de l'entreprise" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CompanyStatus }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={form.siret} onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
              placeholder="SIRET (14 chiffres) — optionnel" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            {(["websites", "githubRepos"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {field === "websites" ? "Sites web" : "Depots GitHub"}
                </label>
                {form[field].map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={url} onChange={(e) => updateUrl(field, i, e.target.value)}
                      placeholder={field === "websites" ? "https://monsite.fr" : "https://github.com/org/repo"}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                    <button onClick={() => removeUrl(field, i)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addUrl(field)} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300">
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={save} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg py-2 text-sm font-medium">Enregistrer</button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
