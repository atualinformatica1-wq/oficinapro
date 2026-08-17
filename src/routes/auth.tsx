import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — MecânicaPRO" },
      { name: "description", content: "Acesse sua conta MecânicaPRO." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signUpSchema = signInSchema.extend({
  full_name: z.string().trim().min(2, "Informe seu nome").max(100),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [session, loading, navigate]);

  async function onSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha inválidos" : error.message);
      return;
    }
    toast.success("Bem-vindo!");
    navigate({ to: "/", replace: true });
  }

  async function onForgotPassword() {
    const email = (document.getElementById("in-email") as HTMLInputElement | null)?.value?.trim() ?? "";
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Informe seu email no campo acima para receber o link de recuperação");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de recuperação para seu email.");
  }

  async function onSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
      full_name: form.get("full_name"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.full_name },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Você já pode entrar.");
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Mecânica<span className="text-primary">PRO</span>
          </span>
        </div>
        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardContent className="p-6">
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="text-white data-[state=active]:text-primary-foreground">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:text-primary-foreground">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="in-email" className="text-white">Email</Label>
                    <Input id="in-email" name="email" type="email" autoComplete="email" required className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="in-pass" className="text-white">Senha</Label>
                    <Input id="in-pass" name="password" type="password" autoComplete="current-password" required className="text-white" />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="w-full text-center text-xs text-white/70 underline-offset-2 hover:text-white hover:underline"
                    disabled={busy}
                  >
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="up-name" className="text-white">Nome completo</Label>
                    <Input id="up-name" name="full_name" type="text" autoComplete="name" required className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="up-email" className="text-white">Email</Label>
                    <Input id="up-email" name="email" type="email" autoComplete="email" required className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="up-pass" className="text-white">Senha</Label>
                    <Input id="up-pass" name="password" type="password" autoComplete="new-password" required minLength={6} className="text-white" />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Criando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
