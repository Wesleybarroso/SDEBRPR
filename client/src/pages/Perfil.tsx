import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Perfil() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [defaultNiche, setDefaultNiche] = useState("");
  const [minScore, setMinScore] = useState("70");
  const [compactMode, setCompactMode] = useState(false);
  const update = trpc.profile.update.useMutation({ onSuccess: async () => { await refresh(); toast.success("Perfil atualizado"); }, onError: e => toast.error(e.message) });
  useEffect(() => { setName(user?.name || ""); setEmail(user?.email || ""); try { const prefs = user?.preferences ? JSON.parse(user.preferences) : {}; setDefaultNiche(prefs.defaultNiche || ""); setMinScore(String(prefs.minScore ?? 70)); setCompactMode(Boolean(prefs.compactMode)); } catch {} }, [user?.name, user?.email, user?.preferences]);
  return <DashboardLayout><div className="min-h-screen bg-[#f6f7f9] p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#719080]">Conta</p><h1 className="mt-2 font-serif text-4xl text-[#18352a]">Seu perfil</h1><p className="mt-2 text-sm text-[#708078]">Identidade, acesso e preferências da sua operação LeadFlow.</p><Card className="mt-7 max-w-3xl border-0 shadow-sm"><CardHeader><CardTitle className="font-serif text-2xl font-normal">Dados da sessão</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex items-center gap-4 rounded-2xl bg-[#edf5ef] p-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18352a] text-lg font-semibold text-white">{user?.name?.slice(0, 1).toUpperCase() || "U"}</div><div><p className="font-semibold text-[#29483a]">{user?.name || "Usuário LeadFlow"}</p><p className="text-sm text-[#6f8177]">{user?.email || "E-mail não informado"}</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium text-[#29483a]">Nome</span><Input value={name} onChange={e => setName(e.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium text-[#29483a]">E-mail</span><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></label><label className="space-y-2"><span className="text-sm font-medium text-[#29483a]">Nicho padrão</span><Input value={defaultNiche} onChange={e => setDefaultNiche(e.target.value)} placeholder="Ex.: dentistas" /></label><label className="space-y-2"><span className="text-sm font-medium text-[#29483a]">Score mínimo para exportação</span><Input value={minScore} onChange={e => setMinScore(e.target.value)} type="number" min="0" max="100" /></label></div><label className="flex items-center gap-3 text-sm text-[#385444]"><input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)} className="h-4 w-4 accent-[#18352a]" />Usar modo compacto nas listas</label><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Permissão</p><Badge className="mt-2 bg-[#dfeee3] text-[#315c49]">{user?.role === "admin" ? "Administrador" : "Operador"}</Badge></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Login</p><p className="mt-2 text-sm text-[#385444]">{user?.loginMethod || "OAuth seguro"}</p></div></div><Button onClick={() => update.mutate({ name, email, preferences: { defaultNiche, minScore: Number(minScore) || 0, compactMode } })} disabled={update.isPending} className="bg-[#18352a] hover:bg-[#285642]">{update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar perfil</Button></CardContent></Card></div></DashboardLayout>;
}
