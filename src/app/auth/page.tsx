"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Loader2, Chrome, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Verificar se já está logado
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push("/");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Login realizado com sucesso!");
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        toast.success("Cadastro realizado! Verifique seu email.");
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      toast.error(error.message || "Erro ao fazer login/cadastro");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      toast.error("Erro ao fazer login com Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center animate-fadeIn">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20 font-rajdhani transition-all duration-300 hover:scale-105"
          aria-label="Voltar para página inicial"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm animate-fadeInUp">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-2xl shadow-xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl text-white font-rajdhani font-bold">
              {isLogin ? "Bem-vindo de volta!" : "Criar Conta"}
            </CardTitle>
            <CardDescription className="text-[#f0abfc] text-lg font-inter">
              {isLogin
                ? "Entre para acessar os modos premium"
                : "Cadastre-se para desbloquear recursos exclusivos"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Social */}
            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-rajdhani font-semibold transition-all duration-300 hover:scale-105 border border-gray-300"
                aria-label="Entrar com Google"
              >
                <Chrome className="w-5 h-5 mr-2" />
                Continuar com Google
              </Button>
            </div>

            <div className="relative">
              <Separator className="bg-[#d946ef]/20" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a0a1f] px-3 text-gray-400 text-sm font-inter">
                ou
              </span>
            </div>

            {/* Login com Email */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-rajdhani flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#e879f9]" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-rajdhani flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#e879f9]" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white font-rajdhani font-bold text-lg py-6 shadow-xl shadow-[#d946ef]/30 transition-all duration-300 hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#f0abfc] hover:text-white font-inter text-sm transition-colors duration-300"
              >
                {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Informação sobre recursos premium */}
        <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm mt-6 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <h3 className="text-white font-rajdhani font-bold text-lg mb-3">
              Recursos Premium Inclusos:
            </h3>
            <ul className="space-y-2 text-gray-300 font-inter text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#d946ef] rounded-full" />
                Duplas Fixas (Super 6, 8 e 12)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#d946ef] rounded-full" />
                Sorteio automático de duplas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#d946ef] rounded-full" />
                Salvamento de torneios
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#d946ef] rounded-full" />
                Perfil personalizado
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#d946ef] rounded-full" />
                Compartilhamento de conquistas
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
