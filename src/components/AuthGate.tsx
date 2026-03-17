"use client";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, member, loading, login, register, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Foundry</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === "login" ? "Connexion à votre espace" : "Créer votre compte"}
          </p>
        </div>

        <input value={email} onChange={(e) => setEmail(e.target.value)}
          type="email" placeholder="Email"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />

        <input value={password} onChange={(e) => setPassword(e.target.value)}
          type="password" placeholder="Mot de passe"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />

        <button onClick={handleSubmit} disabled={busy}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
          {mode === "login" ? <><LogIn className="w-4 h-4" /> Se connecter</> : <><UserPlus className="w-4 h-4" /> Créer le compte</>}
        </button>

        <p className="text-center text-xs text-gray-500">
          {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-sky-400 hover:underline">
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>

        {mode === "register" && (
          <p className="text-xs text-amber-400/70 text-center">
            ⚠️ Utilisez l'email renseigné dans votre fiche membre pour être reconnu automatiquement.
          </p>
        )}
      </div>
    </div>
  );

  async function handleSubmit() {
    if (!email || !password) return toast.error("Email et mot de passe requis");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else { await register(email, password); toast.success("Compte créé !"); }
    } catch (e: any) {
      toast.error(e.message?.includes("user-not-found") ? "Email introuvable" :
        e.message?.includes("wrong-password") ? "Mot de passe incorrect" :
        e.message?.includes("email-already-in-use") ? "Email déjà utilisé" : "Erreur de connexion");
    }
    setBusy(false);
  }

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <button onClick={() => { logout(); toast.success("Déconnecté"); }}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3 py-2 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {member?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
          </div>
          {member?.name || user.email}
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}
