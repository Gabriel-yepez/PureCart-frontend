"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usersService } from "@/lib/api/services/users.service";
import type { User, UserUpdate } from "@/lib/api/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  LogIn,
  User as UserIcon,
  Save,
  Mail,
  Calendar,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfilePage() {
  const { isAuthenticated, accessToken, user: storeUser, setUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function load() {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await usersService.getMyProfile(accessToken);
        if (res.data) {
          setProfile(res.data);
          setFullName(res.data.full_name);
          setAvatarUrl(res.data.avatar_url ?? "");
        }
      } catch {
        toast.error("Error al cargar tu perfil");
      }
      setLoading(false);
    }

    load();
  }, [mounted, isAuthenticated, accessToken]);

  async function handleSave() {
    if (!accessToken || !profile) return;

    setSaving(true);

    const updates: UserUpdate = {};
    if (fullName.trim() !== profile.full_name) {
      updates.full_name = fullName.trim();
    }
    if (avatarUrl.trim() !== (profile.avatar_url ?? "")) {
      updates.avatar_url = avatarUrl.trim() || undefined;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("No hay cambios para guardar");
      setSaving(false);
      return;
    }

    try {
      const res = await usersService.updateMyProfile(updates, accessToken);
      if (res.data) {
        setProfile(res.data);
        setUser(res.data); // Update Zustand store so Header reflects changes
        toast.success("Perfil actualizado exitosamente");
      }
    } catch {
      toast.error("Error al actualizar tu perfil");
    }

    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="grow container mx-auto px-4 py-8 mt-20 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground mb-8">
          Administra tu información personal.
        </p>

        {/* Not authenticated */}
        {mounted && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <LogIn className="w-16 h-16 text-muted-foreground/40" />
            <p className="text-xl text-muted-foreground">
              Inicia sesión para ver tu perfil
            </p>
            <Button asChild>
              <Link href="/signin?redirect=/profile">Iniciar Sesión</Link>
            </Button>
          </div>
        )}

        {/* Loading */}
        {mounted && isAuthenticated && loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Profile content */}
        {mounted && isAuthenticated && !loading && profile && (
          <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
            {/* Avatar + readonly info */}
            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
              </div>
            </div>

            <Separator />

            {/* Read-only metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Rol: <span className="font-medium text-foreground capitalize">{profile.role}</span></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Miembro desde:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(profile.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </div>

            <Separator />

            {/* Editable fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Editar Información</h3>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL del Avatar</Label>
                <Input
                  id="avatar_url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
