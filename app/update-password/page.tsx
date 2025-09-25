"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // Levanta la sesión del hash (#access_token=...&type=recovery)
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(() => {
      // no hace falta nada: supabase-js ya parsea el hash cuando hay evento
    });
    // Trigger para forzar la captura del hash si aplica
    supabase.auth.getSession();

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg(
        "No se pudo actualizar: " +
        error.message +
        ". Pedí otro email si el link expiró."
      );
      return;
    }
    setMsg("Contraseña actualizada. Redirigiendo al login…");
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Cambiar contraseña</h1>
      <form onSubmit={onUpdate} className="space-y-3">
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
          minLength={8}
        />
        <button type="submit" className="w-full bg-black text-white rounded px-3 py-2">
          Actualizar
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}

