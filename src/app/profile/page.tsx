"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Save, Loader2, User, Mail, Phone, MapPin, Trophy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  phone: string;
  location: string;
  favorite_sport: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth");
      return;
    }

    setUser(user);
    await loadProfile(user.id);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    } else {
      // Criar perfil inicial
      const newProfile = {
        id: userId,
        full_name: user?.user_metadata?.full_name || "",
        avatar_url: user?.user_metadata?.avatar_url || "",
        bio: "",
        phone: "",
        location: "",
        favorite_sport: "Beach Tennis",
      };
      setProfile(newProfile);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande! Máximo 2MB.");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      setProfile({ ...profile!, avatar_url: publicUrl });
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          phone: profile.phone,
          location: profile.location,
          favorite_sport: profile.favorite_sport,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = async () => {
    const shareData = {
      title: `Perfil de ${profile?.full_name || "Usuário"}`,
      text: `Confira meu perfil no Super SandPlay!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Perfil compartilhado!");
      } else {
        // Fallback: copiar link
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para área de transferência!");
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
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
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 text-[#f0abfc] hover:text-white hover:bg-[#d946ef]/20 font-rajdhani transition-all duration-300 hover:scale-105"
          aria-label="Voltar para página inicial"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm mb-6 animate-fadeInUp">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-[#d946ef] to-[#c026d3] rounded-2xl shadow-xl">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-white font-rajdhani font-bold">
                    Meu Perfil
                  </CardTitle>
                  <CardDescription className="text-[#f0abfc] text-lg font-inter">
                    Personalize suas informações
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleShareProfile}
                variant="outline"
                className="border-[#d946ef]/30 text-[#f0abfc] hover:bg-[#d946ef]/20 hover:text-white transition-all duration-300"
                aria-label="Compartilhar perfil"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {/* Avatar */}
          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm animate-fadeInUp" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-xl text-white font-rajdhani font-bold">
                Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-[#d946ef]/30 shadow-xl">
                  <AvatarImage src={profile?.avatar_url} alt="Foto de perfil" />
                  <AvatarFallback className="bg-gradient-to-br from-[#d946ef] to-[#c026d3] text-white text-3xl font-rajdhani font-bold">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white rounded-lg font-rajdhani font-semibold transition-all duration-300 hover:scale-105"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Alterar Foto
                      </>
                    )}
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <p className="text-gray-400 text-sm mt-2 font-inter">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card className="bg-white/5 border-[#d946ef]/30 backdrop-blur-sm animate-fadeInUp" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="text-xl text-white font-rajdhani font-bold">
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white font-rajdhani flex items-center gap-2">
                  <User className="w-4 h-4 text-[#e879f9]" />
                  Nome Completo
                </Label>
                <Input
                  id="full_name"
                  value={profile?.full_name || ""}
                  onChange={(e) => setProfile({ ...profile!, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-rajdhani flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#e879f9]" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-white/5 border-[#d946ef]/20 text-gray-400 font-inter cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white font-rajdhani flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#e879f9]" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={profile?.phone || ""}
                  onChange={(e) => setProfile({ ...profile!, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-white font-rajdhani flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#e879f9]" />
                  Localização
                </Label>
                <Input
                  id="location"
                  value={profile?.location || ""}
                  onChange={(e) => setProfile({ ...profile!, location: e.target.value })}
                  placeholder="Cidade, Estado"
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favorite_sport" className="text-white font-rajdhani flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#e879f9]" />
                  Esporte Favorito
                </Label>
                <Input
                  id="favorite_sport"
                  value={profile?.favorite_sport || ""}
                  onChange={(e) => setProfile({ ...profile!, favorite_sport: e.target.value })}
                  placeholder="Beach Tennis"
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white font-rajdhani">
                  Sobre Você
                </Label>
                <Textarea
                  id="bio"
                  value={profile?.bio || ""}
                  onChange={(e) => setProfile({ ...profile!, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você e sua paixão por Beach Tennis..."
                  rows={4}
                  className="bg-white/10 border-[#d946ef]/30 text-white placeholder:text-gray-400 focus:border-[#d946ef] font-inter resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] hover:from-[#c026d3] hover:to-[#a21caf] text-white text-xl py-8 font-rajdhani font-bold shadow-2xl shadow-[#d946ef]/30 transition-all duration-300 hover:scale-105 animate-fadeInUp"
            style={{ animationDelay: "300ms" }}
          >
            {saving ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-6 h-6 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
