"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Zap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function PremiumPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth?redirect=/premium");
      return;
    }

    setUser(user);
    setLoading(false);
  };

  const handleSubscribe = async (planType: "monthly" | "annual") => {
    setRedirecting(true);
    
    const stripeLinks = {
      monthly: "https://buy.stripe.com/5kQ5kFc0I6eu8Qie8F",
      annual: "https://buy.stripe.com/eVq28t4yg7iyd6y7Kh"
    };

    try {
      // Registrar tentativa de assinatura no Supabase
      await supabase.from("subscription_attempts").insert({
        user_id: user.id,
        plan_type: planType,
        status: "pending",
        created_at: new Date().toISOString()
      });

      // Redirecionar para Stripe
      window.location.href = stripeLinks[planType];
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
      toast.error("Erro ao processar assinatura. Tente novamente.");
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d946ef] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20 font-rajdhani transition-all duration-300 hover:scale-105"
          aria-label="Voltar para página inicial"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-fadeInUp">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-2xl shadow-xl">
              <Crown className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-rajdhani font-bold text-white">
            Desbloqueie o Modo Premium
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto font-inter">
            Acesso total aos modos Super 6, Super 8 e Super 12 Duplas Fixas
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Plano Mensal */}
          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#d946ef]/20 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-xl shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-white font-rajdhani font-bold">
                Plano Mensal
              </CardTitle>
              <CardDescription className="text-gray-300 font-inter text-lg">
                Flexibilidade total para você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-rajdhani font-bold text-white">R$ 29,90</span>
                  <span className="text-gray-400 font-inter">/mês</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>Cobrado na hora</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>7 dias de carência incluídos</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>Acesso imediato aos modos Premium</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>Cancele quando quiser</span>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe("monthly")}
                disabled={redirecting}
                className="w-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white text-lg py-6 font-rajdhani font-bold transition-all duration-300 hover:scale-105"
              >
                {redirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redirecionando...
                  </>
                ) : (
                  <>
                    Assinar Mensal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Anual - RECOMENDADO */}
          <Card className="bg-white/5 border-[#d946ef] border-2 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#d946ef]/30 animate-fadeInUp relative" style={{ animationDelay: "200ms" }}>
            {/* Selo Recomendado */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white border-0 font-rajdhani font-bold px-4 py-1 text-sm shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                RECOMENDADO
              </Badge>
            </div>

            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-xl shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-rajdhani font-bold">
                  Economize 33%
                </Badge>
              </div>
              <CardTitle className="text-3xl text-white font-rajdhani font-bold">
                Plano Anual
              </CardTitle>
              <CardDescription className="text-gray-300 font-inter text-lg">
                Melhor custo-benefício
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-rajdhani font-bold text-white">R$ 238,80</span>
                  <span className="text-gray-400 font-inter">/ano</span>
                </div>
                <p className="text-[#e879f9] font-rajdhani font-semibold text-lg">
                  Apenas R$ 19,90/mês
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>Cobrado imediatamente</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>7 dias de carência incluídos</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span>Acesso imediato aos modos Premium</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 font-inter">
                  <Check className="w-5 h-5 text-[#e879f9] flex-shrink-0" />
                  <span className="font-semibold text-[#e879f9]">Economize R$ 119,00 por ano</span>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe("annual")}
                disabled={redirecting}
                className="w-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#d97706] text-white text-lg py-6 font-rajdhani font-bold transition-all duration-300 hover:scale-105 shadow-xl shadow-[#fbbf24]/30"
              >
                {redirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Assinar Anual (Recomendado)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informação sobre Carência */}
        <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm animate-fadeInUp" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-lg shadow-lg flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-rajdhani font-bold text-lg">
                  Como funciona a carência de 7 dias?
                </h3>
                <p className="text-gray-300 font-inter leading-relaxed">
                  Sua assinatura será <span className="text-[#e879f9] font-semibold">cobrada imediatamente</span>. 
                  Você ganha <span className="text-[#e879f9] font-semibold">7 dias de carência</span> para usar tudo sem preocupação. 
                  Após esse período, sua assinatura continua ativa normalmente. 
                  É um benefício, não um teste gratuito - você já tem acesso total desde o primeiro dia!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
