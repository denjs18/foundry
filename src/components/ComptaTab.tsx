"use client";
import { useState } from "react";
import { useCompany, useInvoices } from "@/lib/hooks/useCompany";
import {
  FileText, Plus, AlertCircle, CheckCircle, Clock, Trash2, ExternalLink, Euro, Receipt, BookOpen
} from "lucide-react";
import toast from "react-hot-toast";
import type { Invoice, InvoiceItem, CompanyStatus } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────
function getDeclarations(status: CompanyStatus | undefined) {
  if (!status) return [];
  const base = [
    { id: "urssaf-q1", title: "Déclaration URSSAF T1", dueDate: "2026-01-31", type: "urssaf", description: "CA oct-déc 2025 — autoentrepreneur.urssaf.fr" },
    { id: "urssaf-q2", title: "Déclaration URSSAF T2", dueDate: "2026-04-30", type: "urssaf", description: "CA jan-mar 2026" },
    { id: "urssaf-q3", title: "Déclaration URSSAF T3", dueDate: "2026-07-31", type: "urssaf", description: "CA avr-juin 2026" },
    { id: "urssaf-q4", title: "Déclaration URSSAF T4", dueDate: "2026-10-31", type: "urssaf", description: "CA juil-sep 2026" },
    { id: "ir", title: "Déclaration de revenus (2042-C PRO)", dueDate: "2026-05-25", type: "impots", description: "impots.gouv.fr — BNC/BIC selon activité" },
    { id: "cfe", title: "CFE — Cotisation Foncière des Entreprises", dueDate: "2026-12-15", type: "cfe", description: "impots.gouv.fr — exonération 1ère année" },
  ];
  if (["SARL", "SAS", "SA", "SASU", "EURL"].includes(status)) {
    base.push(
      { id: "is", title: "Acompte IS (1er)", dueDate: "2026-03-15", type: "impots", description: "Impôt sur les sociétés — premier acompte" },
      { id: "is2", title: "Acompte IS (2ème)", dueDate: "2026-06-15", type: "impots", description: "Impôt sur les sociétés — deuxième acompte" },
      { id: "tva", title: "Déclaration TVA mensuelle", dueDate: "2026-04-15", type: "tva", description: "Formulaire CA3 — impots.gouv.fr" }
    );
  }
  const now = new Date();
  return base.map((d) => ({
    ...d,
    status: (new Date(d.dueDate) < now ? "overdue" : new Date(d.dueDate).getTime() - now.getTime() < 30 * 86400000 ? "upcoming" : "upcoming") as "upcoming" | "overdue" | "done"
  }));
}

const TYPE_COLORS: Record<string, string> = {
  urssaf: "bg-blue-900/50 border-blue-700 text-blue-300",
  impots: "bg-orange-900/50 border-orange-700 text-orange-300",
  cfe: "bg-yellow-900/50 border-yellow-700 text-yellow-300",
  tva: "bg-purple-900/50 border-purple-700 text-purple-300",
};

function getSiretGuide(hasSiret: boolean) {
  if (hasSiret) return null;
  return (
    <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-amber-300 font-semibold">
        <AlertCircle className="w-5 h-5" /> Pas encore de SIRET ?
      </div>
      <ol className="text-sm text-amber-200/80 space-y-2 list-decimal list-inside">
        <li>Rendez-vous sur <strong>autoentrepreneur.urssaf.fr</strong> ou <strong>guichet-entreprises.fr</strong></li>
        <li>Créez votre compte et remplissez le formulaire de déclaration d'activité</li>
        <li>Choisissez votre activité (code APE attribué automatiquement)</li>
        <li>Recevez votre numéro SIRET par courrier sous 2-4 semaines</li>
        <li>Renseignez-le dans les paramètres de l'entreprise ci-dessus</li>
      </ol>
      <a href="https://www.autoentrepreneur.urssaf.fr/portail/accueil/creer-mon-auto-entreprise.html"
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-amber-300 hover:underline">
        Créer mon auto-entreprise <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

// ─── Invoice Form ────────────────────────────────────────────────
function InvoiceModal({ company, invoices, onClose, onSave }: {
  company: ReturnType<typeof useCompany>["company"];
  invoices: Invoice[];
  onClose: () => void;
  onSave: (inv: Omit<Invoice, "id">) => void;
}) {
  const nextNumber = (type: "facture" | "devis") => {
    const prefix = type === "facture" ? "FA" : "DE";
    const year = new Date().getFullYear();
    const existing = invoices.filter((i) => i.type === type && i.number.startsWith(`${prefix}-${year}`));
    return `${prefix}-${year}-${String(existing.length + 1).padStart(3, "0")}`;
  };

  const [form, setForm] = useState<Omit<Invoice, "id">>({
    type: "facture", number: "", clientName: "", clientAddress: "", clientSiret: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "", items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    status: "draft", totalHT: 0, tva: 0, totalTTC: 0, notes: ""
  });

  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    items[i].total = items[i].quantity * items[i].unitPrice;
    const totalHT = items.reduce((s, it) => s + it.total, 0);
    const tva = form.tva || 0;
    setForm((f) => ({ ...f, items, totalHT, totalTTC: totalHT * (1 + tva / 100) }));
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }] }));
  const removeItem = (i: number) => {
    const items = form.items.filter((_, idx) => idx !== i);
    const totalHT = items.reduce((s, it) => s + it.total, 0);
    setForm((f) => ({ ...f, items, totalHT, totalTTC: totalHT * (1 + (f.tva || 0) / 100) }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white">Nouveau document</h2>

        <div className="grid grid-cols-2 gap-3">
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "facture" | "devis", number: nextNumber(e.target.value as "facture" | "devis") }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="facture">Facture</option>
            <option value="devis">Devis</option>
          </select>
          <input value={form.number || nextNumber(form.type)} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            placeholder="Numéro" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Client</p>
          <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            placeholder="Nom / Société *" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input value={form.clientAddress} onChange={(e) => setForm((f) => ({ ...f, clientAddress: e.target.value }))}
            placeholder="Adresse" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <input value={form.clientSiret} onChange={(e) => setForm((f) => ({ ...f, clientSiret: e.target.value }))}
            placeholder="SIRET client (optionnel)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Date d'émission</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Date d'échéance</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mt-1" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Prestations</p>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_90px_70px_32px] gap-2 items-center">
              <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center" />
              <input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                placeholder="PU HT" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <span className="text-sm text-gray-300 text-right">{item.total.toFixed(2)} €</span>
              <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={addItem} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300">
            <Plus className="w-3 h-3" /> Ajouter une ligne
          </button>
        </div>

        <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-400">TVA (%)</label>
              <input type="number" value={form.tva} onChange={(e) => {
                const tva = Number(e.target.value);
                setForm((f) => ({ ...f, tva, totalTTC: f.totalHT * (1 + tva / 100) }));
              }} className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm mt-1 block" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-gray-400">Total HT : <span className="text-white font-medium">{form.totalHT.toFixed(2)} €</span></p>
            {form.tva ? <p className="text-sm text-gray-400">TVA {form.tva}% : <span className="text-white">{(form.totalHT * form.tva / 100).toFixed(2)} €</span></p> : null}
            <p className="text-base font-bold text-white">Total TTC : {form.totalTTC.toFixed(2)} €</p>
          </div>
        </div>

        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Notes / conditions de paiement..." rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />

        <div className="flex gap-3">
          <button onClick={() => {
            if (!form.clientName.trim()) return toast.error("Nom du client requis");
            onSave({ ...form, number: form.number || nextNumber(form.type) });
            onClose();
            toast.success("Document créé !");
          }} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg py-2 text-sm font-medium">
            Créer
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 rounded-lg py-2 text-sm">Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────
export default function ComptaTab() {
  const { company } = useCompany();
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "invoices" | "declarations">("overview");

  const declarations = getDeclarations(company?.status);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalTTC, 0);
  const totalPending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.totalTTC, 0);

  const STATUS_LABELS = { draft: "Brouillon", sent: "Envoyée", paid: "Payée", cancelled: "Annulée" };
  const STATUS_COLORS = {
    draft: "bg-gray-700 text-gray-300", sent: "bg-blue-900 text-blue-300",
    paid: "bg-green-900 text-green-300", cancelled: "bg-red-900 text-red-300"
  };

  const sections = [
    { id: "overview", label: "Vue d'ensemble", icon: BookOpen },
    { id: "invoices", label: "Factures & Devis", icon: FileText },
    { id: "declarations", label: "Déclarations", icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id as typeof activeSection)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id ? "bg-sky-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}>
              <Icon className="w-4 h-4" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {getSiretGuide(!company?.siret)}

          {company?.siret && (
            <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-300 font-medium">Entreprise enregistrée</p>
                <p className="text-sm text-green-400/70">SIRET : {company.siret} · Statut : {company.status}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">CA encaissé</p>
              <p className="text-2xl font-bold text-green-400">{totalPaid.toFixed(2)} €</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">En attente de paiement</p>
              <p className="text-2xl font-bold text-yellow-400">{totalPending.toFixed(2)} €</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Documents</p>
              <p className="text-2xl font-bold text-sky-400">{invoices.length}</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" /> Prochaines échéances
            </h3>
            <div className="space-y-3">
              {declarations.slice(0, 4).map((d) => (
                <div key={d.id} className={`border rounded-lg px-4 py-3 ${TYPE_COLORS[d.type] || "bg-gray-800 border-gray-700 text-gray-300"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{d.title}</span>
                    <span className="text-xs opacity-70">
                      {new Date(d.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </span>
                  </div>
                  <p className="text-xs opacity-60 mt-0.5">{d.description}</p>
                </div>
              ))}
            </div>
          </div>

          {company?.status && ["auto-entrepreneur", "micro-entreprise"].includes(company.status) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-white">📋 Guide {company.status}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-white mb-1">🏦 Compte bancaire</p>
                  <p className="text-xs text-gray-400">Obligatoire si CA &gt; 10 000 € / 2 ans consécutifs</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-white mb-1">📊 Plafonds 2026</p>
                  <p className="text-xs text-gray-400">Services : 77 700 € · Commerce : 188 700 €</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-white mb-1">💰 Cotisations sociales</p>
                  <p className="text-xs text-gray-400">BIC vente : 12,3% · BIC services : 21,2% · BNC : 21,1%</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-white mb-1">🧾 Factures</p>
                  <p className="text-xs text-gray-400">Mention obligatoire : "TVA non applicable — art. 293B CGI"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {activeSection === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Factures & Devis</h2>
            <button onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Nouveau document
            </button>
          </div>

          {invoices.length === 0 && (
            <p className="text-center text-gray-600 py-12">Aucun document. Créez votre première facture ou devis !</p>
          )}

          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 flex items-center gap-4 group transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-400">{inv.number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize">{inv.type}</span>
                  </div>
                  <p className="font-medium text-white mt-1">{inv.clientName}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-white">{inv.totalTTC.toFixed(2)} €</p>
                  {inv.tva ? <p className="text-xs text-gray-500">dont TVA {inv.tva}%</p> : null}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select value={inv.status} onChange={(e) => updateInvoice(inv.id, { status: e.target.value as Invoice["status"] })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white">
                    <option value="draft">Brouillon</option>
                    <option value="sent">Envoyée</option>
                    <option value="paid">Payée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                  <button onClick={() => deleteInvoice(inv.id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showInvoiceModal && (
            <InvoiceModal company={company} invoices={invoices}
              onClose={() => setShowInvoiceModal(false)}
              onSave={(inv) => addInvoice(inv)} />
          )}
        </div>
      )}

      {/* Declarations */}
      {activeSection === "declarations" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Calendrier des déclarations — {company?.status || "définissez votre statut"}</h2>
          {!company?.status && (
            <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4 text-amber-300 text-sm">
              ⚠️ Définissez d'abord le statut de votre entreprise dans les paramètres (en-tête) pour voir les déclarations adaptées.
            </div>
          )}
          <div className="space-y-3">
            {declarations.map((d) => (
              <div key={d.id} className={`border rounded-xl px-5 py-4 ${TYPE_COLORS[d.type] || "bg-gray-800 border-gray-700 text-gray-300"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{d.title}</p>
                    <p className="text-xs opacity-70 mt-0.5">{d.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">
                      {new Date(d.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {new Date(d.dueDate) < new Date() && (
                      <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">Passée</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">🔗 Liens officiels utiles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ["URSSAF Auto-entrepreneur", "https://www.autoentrepreneur.urssaf.fr"],
                ["Impôts.gouv.fr", "https://www.impots.gouv.fr"],
                ["Guichet Entreprises", "https://www.guichet-entreprises.fr"],
                ["INSEE (SIRET)", "https://www.sirene.fr"],
                ["Infogreffe", "https://www.infogreffe.fr"],
                ["APCE / Bpifrance Création", "https://bpifrance-creation.fr"],
              ].map(([label, url]) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 bg-gray-800 rounded-lg px-3 py-2">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" /> {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
