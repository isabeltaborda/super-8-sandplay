"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Crown, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  premium_since: string | null;
  premium_grace_end: string | null;
  plan_type: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  monthlyRevenue: number;
  annualRevenue: number;
  newUsersToday: number;
  activeUsersToday: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    newUsersToday: 0,
    activeUsersToday: 0,
  });
  const [users, setUsers] = useState<UserStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserStats[]>([]);
  const [filterType, setFilterType] = useState<"all" | "premium" | "free">("all");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Acesso negado. Faça login primeiro.");
        router.push("/auth?redirect=/admin");
        return;
      }

      setCurrentUser(user);

      // Lista de emails autorizados para acesso admin
      const adminEmails = ["isabeltabordacorretora@gmail.com"];
      
      if (adminEmails.includes(user.email || "")) {
        setIsAdmin(true);
        await loadDashboardData();
      } else {
        toast.error("Você não tem permissão para acessar esta página.");
        router.push("/");
      }
    } catch (error) {
      console.error("Erro ao verificar acesso admin:", error);
      toast.error("Erro ao verificar permissões.");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Buscar todos os usuários
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      const usersList = allUsers || [];
      setUsers(usersList);
      setFilteredUsers(usersList);

      // Calcular estatísticas
      const premiumCount = usersList.filter(u => u.is_premium).length;
      const freeCount = usersList.length - premiumCount;

      // Calcular receita estimada
      const monthlyUsers = usersList.filter(u => u.is_premium && u.plan_type === "monthly").length;
      const annualUsers = usersList.filter(u => u.is_premium && u.plan_type === "annual").length;
      const monthlyRevenue = (monthlyUsers * 29.90) + (annualUsers * 19.90);
      const annualRevenue = (annualUsers * 238.80);

      // Usuários novos hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newToday = usersList.filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate >= today;
      }).length;

      // Usuários ativos hoje (último login hoje)
      const activeToday = usersList.filter(u => {
        if (!u.last_sign_in_at) return false;
        const lastSignIn = new Date(u.last_sign_in_at);
        return lastSignIn >= today;
      }).length;

      setStats({
        totalUsers: usersList.length,
        premiumUsers: premiumCount,
        freeUsers: freeCount,
        monthlyRevenue,
        annualRevenue,
        newUsersToday: newToday,
        activeUsersToday: activeToday,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do dashboard.");
    }
  };

  const handleFilterChange = (type: "all" | "premium" | "free") => {
    setFilterType(type);
    if (type === "all") {
      setFilteredUsers(users);
    } else if (type === "premium") {
      setFilteredUsers(users.filter(u => u.is_premium));
    } else {
      setFilteredUsers(users.filter(u => !u.is_premium));
    }
  };

  const togglePremiumStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_premium: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Status Premium ${!currentStatus ? "ativado" : "desativado"} com sucesso!`);
      await loadDashboardData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status Premium.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl font-rajdhani animate-pulse">Verificando permissões...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-rajdhani font-bold text-white">Painel Admin</h1>
                <p className="text-gray-400 text-sm font-inter">Controle total do aplicativo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] text-white border-0 font-rajdhani">
              Administrador
            </Badge>
            <div className="text-right">
              <p className="text-sm text-gray-400 font-inter">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-inter text-gray-400">Total de Usuários</CardTitle>
                <Users className="w-4 h-4 text-[#d946ef]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-rajdhani font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-gray-400 mt-1 font-inter">
                <span className="text-green-400">+{stats.newUsersToday}</span> hoje
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-inter text-gray-400">Usuários Premium</CardTitle>
                <Crown className="w-4 h-4 text-[#fbbf24]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-rajdhani font-bold text-white">{stats.premiumUsers}</div>
              <p className="text-xs text-gray-400 mt-1 font-inter">
                {stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-inter text-gray-400">Receita Mensal</CardTitle>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-rajdhani font-bold text-white">
                R$ {stats.monthlyRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1 font-inter">Estimativa recorrente</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-inter text-gray-400">Usuários Ativos</CardTitle>
                <Activity className="w-4 h-4 text-[#d946ef]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-rajdhani font-bold text-white">{stats.activeUsersToday}</div>
              <p className="text-xs text-gray-400 mt-1 font-inter">Ativos hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/5 border border-[#d946ef]/30">
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d946ef] data-[state=active]:to-[#c026d3] font-rajdhani">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d946ef] data-[state=active]:to-[#c026d3] font-rajdhani">
              <TrendingUp className="w-4 h-4 mr-2" />
              Análises
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => handleFilterChange("all")}
                variant={filterType === "all" ? "default" : "outline"}
                className={filterType === "all" ? "bg-gradient-to-r from-[#d946ef] to-[#c026d3]" : "border-[#d946ef]/30 text-white"}
              >
                Todos ({stats.totalUsers})
              </Button>
              <Button
                onClick={() => handleFilterChange("premium")}
                variant={filterType === "premium" ? "default" : "outline"}
                className={filterType === "premium" ? "bg-gradient-to-r from-[#d946ef] to-[#c026d3]" : "border-[#d946ef]/30 text-white"}
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium ({stats.premiumUsers})
              </Button>
              <Button
                onClick={() => handleFilterChange("free")}
                variant={filterType === "free" ? "default" : "outline"}
                className={filterType === "free" ? "bg-gradient-to-r from-[#d946ef] to-[#c026d3]" : "border-[#d946ef]/30 text-white"}
              >
                Gratuito ({stats.freeUsers})
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d946ef] to-[#c026d3] flex items-center justify-center text-white font-rajdhani font-bold text-lg">
                          {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-rajdhani font-semibold">
                              {user.full_name || "Sem nome"}
                            </h3>
                            {user.is_premium && (
                              <Badge className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white border-0 text-xs">
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm font-inter">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Criado: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                            </span>
                            {user.last_sign_in_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Último acesso: {new Date(user.last_sign_in_at).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => togglePremiumStatus(user.id, user.is_premium)}
                          size="sm"
                          variant={user.is_premium ? "destructive" : "default"}
                          className={user.is_premium ? "" : "bg-gradient-to-r from-[#d946ef] to-[#c026d3]"}
                        >
                          {user.is_premium ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Remover Premium
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Ativar Premium
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white font-rajdhani">Distribuição de Usuários</CardTitle>
                  <CardDescription className="font-inter">Proporção entre planos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 font-inter">Premium</span>
                        <span className="text-white font-rajdhani font-semibold">
                          {stats.premiumUsers} ({stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#d946ef] to-[#c026d3] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 font-inter">Gratuito</span>
                        <span className="text-white font-rajdhani font-semibold">
                          {stats.freeUsers} ({stats.totalUsers > 0 ? ((stats.freeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#e879f9] to-[#d946ef] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.freeUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white font-rajdhani">Receita Estimada</CardTitle>
                  <CardDescription className="font-inter">Projeções financeiras</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-gray-400 text-sm font-inter">Mensal Recorrente</p>
                        <p className="text-2xl font-rajdhani font-bold text-white">
                          R$ {stats.monthlyRevenue.toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-gray-400 text-sm font-inter">Anual Recorrente</p>
                        <p className="text-2xl font-rajdhani font-bold text-white">
                          R$ {(stats.monthlyRevenue * 12).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-[#d946ef]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
