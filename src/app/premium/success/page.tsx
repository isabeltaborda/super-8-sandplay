import React, { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <main style={{ padding: "20px" }}>
      <p>Obrigado pelo pagamento! Confirmação abaixo:</p>
      <Suspense fallback={<div>Carregando...</div>}>
        <SuccessClient />
      </Suspense>
    </main>
  );
}
