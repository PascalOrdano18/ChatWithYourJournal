"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/update-password"
    })

    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Revisa tu correo para restablecer la contraseña")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Enviar link</button>
      <p>{message}</p>
    </form>
  )
}

