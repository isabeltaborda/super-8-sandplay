"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id") ?? "";

  return (
    <div style={{ marginTop: "20px" }}>
      <h1>Pagamento confirmado 🎉</h1>
      {sessionId ? (
        <p>ID da sessão: <strong>{sessionId}</strong></p>
      ) : (
        <p>ID da sessão não encontrado.</p>
      )}
    </div>
  );
}
