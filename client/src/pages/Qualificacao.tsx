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
  return <DashboardLayout><div className="min-h-screen bg-[#f6f7f9] p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#719080]">Inteligência operacional</p><h1 className="mt-2 font-serif text-4xl text-[#18352a]">Qualificação por IA</h1><p className="mt-2 max-w-2xl text-sm text-[#708078]">Aplique uma leitura padronizada sobre contexto, presença digital, avaliações e potencial de conversa. Cada decisão fica registrada no histórico.</p><Card className="mt-7 border-0 shadow-sm"><CardHeader><CardTitle className="font-serif text-2xl font-normal">Fila de análise</CardTitle></CardHeader><CardContent>{rows.length ? <div className="space-y-3">{rows.map(row => <div key={row.id} className="flex flex-col justify-between gap-4 rounded-xl border border-[#e7eee9] bg-white p-4 md:flex-row md:items-center"><div><p className="font-semibold text-[#29483a]">{row.name}</p><p className="mt-1 text-xs text-[#7c8b83]">{row.category || "Nicho não informado"} · {row.city || "Localidade não informada"} · {row.phone}</p></div><div className="flex items-center gap-3"><Badge variant="outline">WhatsApp válido</Badge><Button size="sm" onClick={() => qualify.mutate({ id: row.id })} disabled={qualify.isPending} className="bg-[#18352a] hover:bg-[#285642]">{qualify.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}Analisar lead</Button></div></div>)}</div> : <div className="rounded-xl border border-dashed border-[#d8e5dc] py-16 text-center"><Sparkles className="mx-auto h-7 w-7 text-[#88a995]" /><p className="mt-3 text-sm font-medium text-[#42624f]">A fila está limpa.</p><p className="mt-1 text-xs text-[#8b9a92]">Novos leads válidos aparecerão aqui após a coleta.</p></div>}</CardContent></Card></div></DashboardLayout>;
}
