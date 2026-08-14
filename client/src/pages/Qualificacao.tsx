import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Qualificacao() {
  const query = trpc.leads.list.useQuery({ whatsapp: "valid" }, { retry: false });
  const qualify = trpc.leads.qualify.useMutation({ onSuccess: () => { toast.success("Análise concluída"); query.refetch(); }, onError: e => toast.error(e.message) });
  const rows = (query.data ?? []).filter(row => row.qualificationStatus === "pending").slice(0, 30);
  return <DashboardLayout><div className="min-h-screen bg-background p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Inteligência operacional</p><h1 className="mt-2 font-serif text-4xl text-foreground">Qualificação por IA</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Aplique uma leitura padronizada sobre contexto, presença digital, avaliações e potencial de conversa. Cada decisão fica registrada no histórico.</p><Card className="mt-7 border-0 shadow-sm"><CardHeader><CardTitle className="font-serif text-2xl font-normal">Fila de análise</CardTitle></CardHeader><CardContent>{rows.length ? <div className="space-y-3">{rows.map(row => <div key={row.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-white p-4 md:flex-row md:items-center"><div><p className="font-semibold text-foreground">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.category || "Nicho não informado"} · {row.city || "Localidade não informada"} · {row.phone}</p></div><div className="flex items-center gap-3"><Badge variant="outline">WhatsApp válido</Badge><Button size="sm" onClick={() => qualify.mutate({ id: row.id })} disabled={qualify.isPending} className="bg-slate-950 hover:bg-indigo-600">{qualify.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}Analisar lead</Button></div></div>)}</div> : <div className="rounded-xl border border-dashed border-border py-16 text-center"><Sparkles className="mx-auto h-7 w-7 text-indigo-500" /><p className="mt-3 text-sm font-medium text-foreground">A fila está limpa.</p><p className="mt-1 text-xs text-muted-foreground">Novos leads válidos aparecerão aqui após a coleta.</p></div>}</CardContent></Card></div></DashboardLayout>;
}
