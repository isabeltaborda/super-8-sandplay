"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Crown, Lock, ChevronRight, Star, Zap, ArrowLeft, Save, LogOut, User, List, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type GameMode = "super8" | "super12" | "super6-fixed" | "super8-fixed" | "super12-fixed";
type PairingType = "manual" | "random";

// Rodadas oficiais fixas
const OFFICIAL_ROUNDS = {
  super8: [
    [[1, 2, 3, 4], [5, 6, 7, 8]],
    [[1, 3, 2, 5], [4, 7, 6, 8]],
    [[1, 4, 2, 6], [3, 7, 5, 8]],
    [[1, 5, 2, 7], [3, 6, 4, 8]],
    [[1, 6, 2, 8], [3, 5, 4, 7]],
    [[1, 7, 3, 8], [2, 4, 5, 6]],
    [[1, 8, 3, 6], [2, 5, 4, 7]],
  ],
  super12: [
    [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
    [[1, 3, 2, 5], [4, 6, 7, 9], [8, 10, 11, 12]],
    [[1, 4, 2, 6], [3, 5, 7, 10], [8, 9, 11, 12]],
    [[1, 5, 2, 7], [3, 6, 4, 8], [9, 10, 11, 12]],
    [[1, 6, 2, 8], [3, 7, 4, 9], [5, 10, 11, 12]],
    [[1, 7, 2, 9], [3, 8, 4, 10], [5, 6, 11, 12]],
    [[1, 8, 2, 10], [3, 9, 4, 11], [5, 7, 6, 12]],
    [[1, 9, 2, 11], [3, 10, 4, 12], [5, 8, 6, 7]],
    [[1, 10, 2, 12], [3, 11, 4, 7], [5, 9, 6, 8]],
    [[1, 11, 3, 12], [2, 7, 4, 8], [5, 6, 9, 10]],
    [[1, 12, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]],
  ],
  "super6-fixed": [
    [[1, 2], [3, 4], [5, 6]],
    [[1, 3], [2, 5], [4, 6]],
    [[1, 4], [2, 6], [3, 5]],
    [[1, 5], [2, 4], [3, 6]],
    [[1, 6], [2, 3], [4, 5]],
  ],
  "super8-fixed": [
    [[1, 2], [3, 4], [5, 6], [7, 8]],
    [[1, 3], [2, 5], [4, 7], [6, 8]],
    [[1, 4], [2, 6], [3, 8], [5, 7]],
    [[1, 5], [2, 7], [3, 6], [4, 8]],
    [[1, 6], [2, 8], [3, 5], [4, 7]],
    [[1, 7], [2, 3], [4, 6], [5, 8]],
    [[1, 8], [2, 4], [3, 7], [5, 6]],
  ],
  "super12-fixed": [
    [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12]],
    [[1, 3], [2, 5], [4, 7], [6, 9], [8, 11], [10, 12]],
    [[1, 4], [2, 6], [3, 8], [5, 9], [7, 10], [11, 12]],
    [[1, 5], [2, 7], [3, 6], [4, 8], [9, 11], [10, 12]],
    [[1, 6], [2, 8], [3, 9], [4, 10], [5, 11], [7, 12]],
    [[1, 7], [2, 9], [3, 10], [4, 11], [5, 8], [6, 12]],
    [[1, 8], [2, 10], [3, 11], [4, 12], [5, 7], [6, 9]],
    [[1, 9], [2, 11], [3, 12], [4, 5], [6, 8], [7, 10]],
    [[1, 10], [2, 12], [3, 5], [4, 6], [7, 9], [8, 11]],
    [[1, 11], [2, 3], [4, 7], [5, 10], [6, 12], [8, 9]],
    [[1, 12], [2, 4], [3, 7], [5, 8], [6, 10], [9, 11]],
  ],
};

export default function Home() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedPairingType, setSelectedPairingType] = useState<PairingType | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      await loadProfile(user.id);
    }
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setIsPremium(data.is_premium || false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsPremium(false);
  };

  const freeModes = [
    {
      id: "super8" as GameMode,
      title: "Super 8",
      subtitle: "Individual",
      description: "8 jogadores, 7 rodadas fixas sem repetições",
      icon: Trophy,
      color: "from-[#d946ef] to-[#c026d3]",
      players: 8,
      rounds: 7,
    },
    {
      id: "super12" as GameMode,
      title: "Super 12",
      subtitle: "Individual",
      description: "12 jogadores, 11 rodadas com máxima variedade",
      icon: Users,
      color: "from-[#e879f9] to-[#d946ef]",
      players: 12,
      rounds: 11,
    },
  ];

  const premiumModes = [
    {
      id: "super6-fixed" as GameMode,
      title: "Super 6",
      subtitle: "Duplas Fixas",
      description: "6 duplas fixas, 5 rodadas completas",
      icon: Crown,
      color: "from-[#f0abfc] to-[#e879f9]",
      players: 6,
      rounds: 5,
      premium: true,
    },
    {
      id: "super8-fixed" as GameMode,
      title: "Super 8",
      subtitle: "Duplas Fixas",
      description: "8 duplas fixas, 7 rodadas completas",
      icon: Crown,
      color: "from-[#d946ef] to-[#c026d3]",
      players: 8,
      rounds: 7,
      premium: true,
    },
    {
      id: "super12-fixed" as GameMode,
      title: "Super 12",
      subtitle: "Duplas Fixas",
      description: "12 duplas fixas, 11 rodadas completas",
      icon: Crown,
      color: "from-[#c026d3] to-[#a21caf]",
      players: 12,
      rounds: 11,
      premium: true,
    },
  ];

  const handleModeSelect = async (modeId: GameMode, isPremiumMode: boolean, pairingType?: PairingType) => {
    if (isPremiumMode) {
      if (!user) {
        // Não está logado - redireciona para login
        router.push("/auth?redirect=/premium");
      } else {
        // Está logado - verificar se é Premium
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (profile?.is_premium) {
          // É Premium - libera acesso
          setSelectedMode(modeId);
          setSelectedPairingType(pairingType || null);
        } else {
          // Não é Premium - redireciona para tela de pagamento
          router.push("/premium");
        }
      }
    } else {
      // Modo gratuito - acesso direto
      setSelectedMode(modeId);
      setSelectedPairingType(pairingType || null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl font-rajdhani animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (selectedMode) {
    return <ModeSetup mode={selectedMode} pairingType={selectedPairingType} onBack={() => { setSelectedMode(null); setSelectedPairingType(null); }} user={user} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Header com Login/Logout */}
        <div className="flex flex-col items-end gap-2 mb-4">
          <div className="flex justify-end">
            {user ? (
              <div className="flex items-center gap-3 animate-slideInRight">
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-[#d946ef]/30 transition-all hover:bg-white/10 hover:border-[#d946ef]/50 hover:scale-105 focus:ring-2 focus:ring-[#d946ef] focus:outline-none"
                  aria-label="Ver perfil"
                >
                  <Avatar className="w-6 h-6 border border-[#d946ef]/30">
                    <AvatarImage src={profile?.avatar_url} alt="Foto de perfil" />
                    <AvatarFallback className="bg-gradient-to-br from-[#d946ef] to-[#c026d3] text-white text-xs font-rajdhani font-bold">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-inter">
                    {profile?.full_name || user.email}
                  </span>
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white border-0 font-rajdhani text-xs">
                      Premium
                    </Badge>
                  )}
                </button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20 font-rajdhani transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#d946ef] focus:outline-none"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => router.push("/auth")}
                className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white font-rajdhani font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#d946ef]/30 focus:ring-2 focus:ring-[#d946ef] focus:outline-none animate-slideInRight"
                aria-label="Fazer login ou cadastro"
              >
                <User className="w-4 h-4 mr-2" />
                Login / Cadastro
              </Button>
            )}
          </div>
          
          {/* Botão Admin */}
          <Button
            onClick={() => router.push("/admin")}
            className="bg-gradient-to-r from-[#a21caf] to-[#86198f] hover:from-[#86198f] hover:to-[#701a75] text-white font-rajdhani font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#a21caf]/30 focus:ring-2 focus:ring-[#a21caf] focus:outline-none animate-slideInRight"
            aria-label="Acesso administrativo"
          >
            <Crown className="w-4 h-4 mr-2" />
            Acesso Admin
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-fadeInUp">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/8b6d5aee-f048-4199-b584-223ed318603f.png" 
              alt="Super SandPlay Logo - Gerenciamento de Beach Tennis" 
              className="h-24 md:h-32 w-auto drop-shadow-2xl animate-scaleIn"
              loading="eager"
            />
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto font-inter">
            Gerenciamento Profissional de Disputas de Beach Tennis com Precisão Absoluta
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Zap, text: "Rodadas Fixas", color: "from-[#d946ef] to-[#c026d3]" },
            { icon: Star, text: "Sem Repetições", color: "from-[#e879f9] to-[#d946ef]" },
            { icon: Lock, text: "100% Preciso", color: "from-[#f0abfc] to-[#e879f9]" },
            { icon: Trophy, text: "Ranking Auto", color: "from-[#c026d3] to-[#a21caf]" },
          ].map((feature, idx) => (
            <Card 
              key={idx} 
              className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#d946ef]/20 animate-fadeInUp cursor-pointer focus-within:ring-2 focus-within:ring-[#d946ef]"
              style={{ animationDelay: `${idx * 100}ms` }}
              tabIndex={0}
              role="article"
              aria-label={`Recurso: ${feature.text}`}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className={`p-2 bg-gradient-to-br ${feature.color} rounded-lg shadow-lg transition-transform duration-300 hover:rotate-6`}>
                  <feature.icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span className="text-white font-rajdhani font-semibold text-sm">{feature.text}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modos Gratuitos */}
        <div className="mb-12 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-lg shadow-lg">
              <Star className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-rajdhani font-bold text-white">Modos Gratuitos</h2>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-rajdhani" role="status">Liberado</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freeModes.map((mode, idx) => (
              <div key={mode.id} className="animate-fadeInUp" style={{ animationDelay: `${500 + idx * 100}ms` }}>
                <ModeCard mode={mode} onSelect={() => handleModeSelect(mode.id, false)} />
              </div>
            ))}
          </div>
        </div>

        {/* Modos Premium */}
        <div className="animate-fadeInUp" style={{ animationDelay: "700ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-lg shadow-lg">
              <Crown className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-rajdhani font-bold text-white">Modos Premium</h2>
            <Badge className="bg-[#d946ef]/20 text-[#f0abfc] border-[#d946ef]/30 font-rajdhani" role="status">
              <Lock className="w-3 h-3 mr-1" aria-hidden="true" />
              {isPremium ? "Desbloqueado" : user ? "Assinar Premium" : "Requer Login"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumModes.map((mode, idx) => (
              <div key={mode.id} className="animate-fadeInUp" style={{ animationDelay: `${800 + idx * 100}ms` }}>
                <ModeCardWithPairing mode={mode} onSelect={(pairingType) => handleModeSelect(mode.id, true, pairingType)} locked={!isPremium} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ mode, onSelect, locked = false }: { mode: any; onSelect: () => void; locked?: boolean }) {
  return (
    <Card
      className={`bg-white/5 border-[#d946ef]/30 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#d946ef]/20 cursor-pointer focus-within:ring-2 focus-within:ring-[#d946ef] ${
        locked ? "relative" : ""
      }`}
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-label={`Selecionar modo ${mode.title} ${mode.subtitle}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {locked && (
        <div className="absolute top-4 right-4 p-2 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-lg shadow-lg" aria-label="Modo bloqueado">
          <Lock className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${mode.color} rounded-xl shadow-lg transition-transform duration-300 hover:rotate-6`}>
            <mode.icon className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          {mode.premium && !locked && (
            <Badge className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] text-white border-0 font-rajdhani">Premium</Badge>
          )}
        </div>
        <CardTitle className="text-2xl text-white font-rajdhani font-bold">
          {mode.title}
          <span className="block text-sm font-normal text-[#f0abfc] mt-1 font-inter">{mode.subtitle}</span>
        </CardTitle>
        <CardDescription className="text-gray-300 font-inter">{mode.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="space-y-1">
            <div className="text-gray-400 font-inter">
              <span className="text-[#e879f9] font-rajdhani font-semibold">{mode.players}</span>{" "}
              {mode.subtitle.includes("Duplas") ? "duplas" : "jogadores"}
            </div>
            <div className="text-gray-400 font-inter">
              <span className="text-[#e879f9] font-rajdhani font-semibold">{mode.rounds}</span> rodadas
            </div>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white font-rajdhani font-semibold transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-[#d946ef] focus:outline-none"
            aria-label={locked ? "Fazer login para acessar" : "Iniciar modo"}
          >
            {locked ? "Login" : "Iniciar"} <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ModeCardWithPairing({ mode, onSelect, locked = false }: { mode: any; onSelect: (pairingType: PairingType) => void; locked?: boolean }) {
  const [showOptions, setShowOptions] = useState(false);

  const handleClick = () => {
    if (locked) {
      onSelect("manual"); // Redireciona para login/premium
    } else {
      setShowOptions(!showOptions);
    }
  };

  return (
    <Card
      className={`bg-white/5 border-[#d946ef]/30 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#d946ef]/20 focus-within:ring-2 focus-within:ring-[#d946ef] ${
        locked ? "relative cursor-pointer" : ""
      }`}
      onClick={locked ? handleClick : undefined}
      tabIndex={locked ? 0 : undefined}
      role={locked ? "button" : undefined}
      aria-label={locked ? `Fazer login para acessar ${mode.title}` : undefined}
      onKeyDown={locked ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {locked && (
        <div className="absolute top-4 right-4 p-2 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-lg shadow-lg" aria-label="Modo bloqueado">
          <Lock className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${mode.color} rounded-xl shadow-lg transition-transform duration-300 hover:rotate-6`}>
            <mode.icon className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          {mode.premium && !locked && (
            <Badge className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] text-white border-0 font-rajdhani">Premium</Badge>
          )}
        </div>
        <CardTitle className="text-2xl text-white font-rajdhani font-bold">
          {mode.title}
          <span className="block text-sm font-normal text-[#f0abfc] mt-1 font-inter">{mode.subtitle}</span>
        </CardTitle>
        <CardDescription className="text-gray-300 font-inter">{mode.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <div className="text-gray-400 font-inter">
                <span className="text-[#e879f9] font-rajdhani font-semibold">{mode.players}</span> duplas
              </div>
              <div className="text-gray-400 font-inter">
                <span className="text-[#e879f9] font-rajdhani font-semibold">{mode.rounds}</span> rodadas
              </div>
            </div>
          </div>

          {!locked && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onSelect("manual")}
                className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white font-rajdhani font-semibold text-xs transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#d946ef] focus:outline-none"
                aria-label="Selecionar modo manual"
              >
                <List className="w-3 h-3 mr-1" aria-hidden="true" />
                Manual
              </Button>
              <Button
                size="sm"
                onClick={() => onSelect("random")}
                className="bg-gradient-to-r from-[#e879f9] to-[#d946ef] hover:from-[#d946ef] hover:to-[#c026d3] text-white font-rajdhani font-semibold text-xs transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#d946ef] focus:outline-none"
                aria-label="Selecionar modo sorteado"
              >
                <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
                Sorteada
              </Button>
            </div>
          )}

          {locked && (
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white font-rajdhani font-semibold transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#d946ef] focus:outline-none"
              aria-label="Fazer login para acessar"
            >
              {locked ? "Assinar Premium" : "Iniciar"} <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente ModeSetup
function ModeSetup({ mode, pairingType, onBack, user }: { mode: GameMode; pairingType: PairingType | null; onBack: () => void; user: any }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [tournamentStarted, setTournamentStarted] = useState(false);

  const getPlayerCount = () => {
    if (mode === "super8" || mode === "super8-fixed") return 8;
    if (mode === "super12" || mode === "super12-fixed") return 12;
    if (mode === "super6-fixed") return 6;
    return 8;
  };

  const playerCount = getPlayerCount();

  useEffect(() => {
    setPlayers(Array(playerCount).fill(""));
  }, [playerCount]);

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handleStart = () => {
    const filledPlayers = players.filter(p => p.trim() !== "");
    if (filledPlayers.length === playerCount) {
      setTournamentStarted(true);
    }
  };

  const isReadyToStart = players.filter(p => p.trim() !== "").length === playerCount;

  if (tournamentStarted) {
    return <TournamentView mode={mode} players={players} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20 font-rajdhani"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white font-rajdhani font-bold">
              Configurar {mode.includes("fixed") ? "Duplas" : "Jogadores"}
            </CardTitle>
            <CardDescription className="text-gray-300 font-inter">
              Insira os nomes de todos os {mode.includes("fixed") ? "pares de duplas" : "jogadores"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`player-${index}`} className="text-white font-inter">
                    {mode.includes("fixed") ? `Dupla ${index + 1}` : `Jogador ${index + 1}`}
                  </Label>
                  <Input
                    id={`player-${index}`}
                    value={player}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={mode.includes("fixed") ? `Nome da dupla ${index + 1}` : `Nome do jogador ${index + 1}`}
                    className="bg-white/5 border-[#d946ef]/30 text-white placeholder:text-gray-500 focus:border-[#d946ef]"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleStart}
              disabled={!isReadyToStart}
              className="w-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white font-rajdhani font-semibold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Torneio
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente TournamentView
function TournamentView({ mode, players, onBack }: { mode: GameMode; players: string[]; onBack: () => void }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [scores, setScores] = useState<{ [key: string]: number }>({});

  const rounds = OFFICIAL_ROUNDS[mode];

  const handleScoreChange = (playerIndex: number, score: number) => {
    setScores(prev => ({
      ...prev,
      [playerIndex]: (prev[playerIndex] || 0) + score
    }));
  };

  const getRanking = () => {
    return players
      .map((player, index) => ({
        name: player,
        score: scores[index] || 0,
        index
      }))
      .sort((a, b) => b.score - a.score);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20 font-rajdhani"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-white font-rajdhani text-xl">
            Rodada {currentRound + 1} de {rounds.length}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rodada Atual */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-white font-rajdhani font-bold">
                  Rodada {currentRound + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rounds[currentRound]?.map((match, matchIndex) => (
                  <div key={matchIndex} className="p-4 bg-white/5 rounded-lg border border-[#d946ef]/20">
                    <div className="text-white font-rajdhani font-semibold mb-2">
                      Mesa {matchIndex + 1}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {match.map((playerNum) => (
                        <div key={playerNum} className="text-gray-300 font-inter">
                          {players[playerNum - 1]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setCurrentRound(Math.max(0, currentRound - 1))}
                    disabled={currentRound === 0}
                    variant="outline"
                    className="flex-1 border-[#d946ef]/30 text-white hover:bg-[#d946ef]/20"
                  >
                    Rodada Anterior
                  </Button>
                  <Button
                    onClick={() => setCurrentRound(Math.min(rounds.length - 1, currentRound + 1))}
                    disabled={currentRound === rounds.length - 1}
                    className="flex-1 bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white"
                  >
                    Próxima Rodada
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking */}
          <div>
            <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-white font-rajdhani font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#d946ef]" />
                  Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getRanking().map((player, index) => (
                    <div
                      key={player.index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-[#d946ef]/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-rajdhani font-bold ${
                          index === 0 ? "bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-white" :
                          index === 1 ? "bg-gradient-to-br from-[#d946ef] to-[#c026d3] text-white" :
                          index === 2 ? "bg-gradient-to-br from-[#e879f9] to-[#d946ef] text-white" :
                          "bg-white/10 text-gray-300"
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-white font-inter">{player.name}</span>
                      </div>
                      <span className="text-[#e879f9] font-rajdhani font-semibold">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
