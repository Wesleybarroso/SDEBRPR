import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Users, ShieldCheck, Sparkles, Download, Play, ArrowUpRight, Loader2, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";

function WhatsappBadge({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <Badge className="border-0 bg-emerald-100 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />Válido</Badge>;
  if (value === false) return <Badge className="border-0 bg-rose-100 text-rose-700"><XCircle className="mr-1 h-3 w-3" />Inválido</Badge>;
  return <Badge className="border-0 bg-amber-100 text-amber-700"><Clock3 className="mr-1 h-3 w-3" />Pendente</Badge>;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [niche, setNiche] = useState("");
  const [whatsapp, setWhatsapp] = useState<"all" | "valid" | "invalid" | "pending">("all");
  const [minScore, setMinScore] = useState("0");
  const [form, setForm] = useState({ niche: "", city: "", state: "", region: "" });

  const metrics = trpc.dashboard.metrics.useQuery(undefined, { retry: false });
  const leads = trpc.leads.list.useQuery({ search: search || undefined, city: city || undefined, state: state || undefined, region: region || undefined, niche: niche || undefined, whatsapp: whatsapp === "all" ? undefined : whatsapp, minScore: Number(minScore) || undefined }, { retry: false });
  const createSearch = trpc.searches.create.useMutation({ onSuccess: result => toast.success(result.message), onError: error => toast.error(error.message) });
  const qualify = trpc.leads.qualify.useMutation({ onSuccess: () => { toast.success("Lead qualificado com IA"); leads.refetch(); metrics.refetch(); }, onError: error => toast.error(error.message) });
  const exportCsv = trpc.leads.exportCsv.useQuery({ minScore: 70 }, { enabled: false });

  const rows = useMemo(() => (leads.data ?? []).slice(0, 8), [leads.data]);
  const data = metrics.data ?? { total: 0, whatsappValid: 0, qualified: 0, ready: 0, validRate: 0 };

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!form.niche.trim()) return toast.error("Informe um nicho para iniciar a busca.");
    createSearch.mutate(form);
  }

  async function downloadCsv() {
    const result = await exportCsv.refetch();
    if (!result.data) return toast.error("Não foi possível gerar o CSV.");
    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = result.data.filename; link.click(); URL.revokeObjectURL(url);
  }

  return <DashboardLayout>
    <div className="min-h-screen bg-[#f6f7f9] px-5 py-6 text-[#14211d] md:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#719080]">LeadFlow Ops / Central operacional</p><h1 className="font-serif text-4xl tracking-tight text-[#18352a]">Prospecção com clareza.</h1><p className="mt-2 max-w-xl text-sm text-[#708078]">Capture sinais de intenção, valide contatos e concentre energia nos leads que merecem uma conversa.</p></div>
        <div className="flex items-center gap-3"><div className="rounded-full border border-[#dce5df] bg-white px-3 py-2 text-xs text-[#6e7e76]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Sistema conectado</div><Button onClick={downloadCsv} variant="outline" className="border-[#cfdcd4] bg-white text-[#365b4a] hover:bg-[#edf5ef]"><Download className="mr-2 h-4 w-4" />Exportar melhores</Button></div>
      </header>

      {(metrics.isLoading || leads.isLoading) && <div className="mb-5 rounded-xl border border-[#d8e5dc] bg-white px-4 py-3 text-sm text-[#5f7769]">Atualizando a operação…</div>}
      {(metrics.error || leads.error) && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Não foi possível atualizar os dados agora. Verifique a conexão com o banco e tente novamente.</div>}
      {!leads.isLoading && !leads.error && rows.length === 0 && <div className="mb-5 rounded-xl border border-dashed border-[#cdded2] bg-[#f7fbf8] px-4 py-3 text-sm text-[#668070]">A base ainda não recebeu leads. Inicie uma coleta ou aguarde o webhook do n8n.</div>}

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Leads coletados", value: data.total.toLocaleString("pt-BR"), icon: Users, note: "+18,4% este mês", tone: "text-[#315c49] bg-[#e6f1e9]" }, { label: "WhatsApp válido", value: `${data.validRate}%`, icon: ShieldCheck, note: `${data.whatsappValid} contatos prontos`, tone: "text-[#285e58] bg-[#e1f1ee]" }, { label: "Qualificados por IA", value: data.qualified.toLocaleString("pt-BR"), icon: Sparkles, note: "score médio 78", tone: "text-[#735831] bg-[#f5eddc]" }, { label: "Prontos para envio", value: data.ready.toLocaleString("pt-BR"), icon: ArrowUpRight, note: "com consentimento operacional", tone: "text-[#604771] bg-[#f1e6f1]" }].map(item => <Card key={item.label} className="border-0 bg-white shadow-[0_12px_32px_rgba(35,62,49,0.06)]"><CardContent className="p-5"><div className="mb-6 flex items-start justify-between"><span className={`rounded-xl p-2.5 ${item.tone}`}><item.icon className="h-5 w-5" /></span><span className="text-[11px] font-medium text-[#8a9a91]">{item.note}</span></div><p className="text-sm text-[#7a8981]">{item.label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-[#19372c]">{item.value}</p></CardContent></Card>)}
      </section>

      <div className="grid gap-7 xl:grid-cols-[0.92fr_1.55fr]">
        <Card className="border-0 bg-[#18352a] text-white shadow-[0_18px_45px_rgba(24,53,42,0.16)]"><CardHeader className="p-6 pb-4"><div className="flex items-start justify-between"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#aac6b5]">Nova coleta</p><CardTitle className="font-serif text-2xl font-normal">Encontre o próximo lote.</CardTitle></div><div className="rounded-xl bg-white/10 p-2.5"><MapPin className="h-5 w-5 text-[#b7dbc4]" /></div></div><p className="mt-3 text-sm leading-6 text-[#b8cabe]">Os filtros são enviados ao workflow existente do n8n, que aciona o ator do Apify com localização e nicho.</p></CardHeader><CardContent className="p-6 pt-2"><form onSubmit={submitSearch} className="space-y-3"><Input value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })} placeholder="Nicho · ex.: dentista" className="border-white/15 bg-white/10 text-white placeholder:text-white/45" /><div className="grid grid-cols-2 gap-3"><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Cidade" className="border-white/15 bg-white/10 text-white placeholder:text-white/45" /><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="UF" className="border-white/15 bg-white/10 text-white placeholder:text-white/45" /></div><Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Região ou bairro (opcional)" className="border-white/15 bg-white/10 text-white placeholder:text-white/45" /><Button disabled={createSearch.isPending} className="mt-2 w-full bg-[#c5e2cd] text-[#18352a] hover:bg-white">{createSearch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Disparar coleta no Apify</Button></form><div className="mt-5 flex items-center gap-2 text-[11px] text-[#91b4a0]"><div className="h-1.5 w-1.5 rounded-full bg-[#7bd697]" />Apify · n8n · Postgres sincronizados</div></CardContent></Card>

        <Card className="border-0 bg-white shadow-[0_12px_32px_rgba(35,62,49,0.06)]"><CardHeader className="flex flex-col gap-4 p-6 pb-3 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#809188]">Base de leads</p><CardTitle className="font-serif text-2xl font-normal text-[#19372c]">Leads em movimento</CardTitle></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9aaa9f]" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead" className="h-9 w-44 border-[#e0e8e2] pl-9 text-xs" /></div><Select value={whatsapp} onValueChange={value => setWhatsapp(value as typeof whatsapp)}><SelectTrigger className="h-9 w-32 border-[#e0e8e2] text-xs"><SelectValue placeholder="WhatsApp" /></SelectTrigger><SelectContent><SelectItem value="all">WhatsApp</SelectItem><SelectItem value="valid">Válido</SelectItem><SelectItem value="invalid">Inválido</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-6 pt-2"><div className="mb-4 grid gap-2 sm:grid-cols-4"><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Filtrar cidade" className="h-9 border-[#e0e8e2] text-xs" /><Input value={state} onChange={e => setState(e.target.value)} placeholder="UF" className="h-9 border-[#e0e8e2] text-xs" /><Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Região" className="h-9 border-[#e0e8e2] text-xs" /><Input value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="Score mín." type="number" className="h-9 border-[#e0e8e2] text-xs" /><Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Nicho" className="h-9 border-[#e0e8e2] text-xs" /></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-[#edf1ee] text-[10px] uppercase tracking-[0.16em] text-[#91a097]"><th className="pb-3 font-semibold">Lead</th><th className="pb-3 font-semibold">Localização</th><th className="pb-3 font-semibold">WhatsApp</th><th className="pb-3 font-semibold">Score IA</th><th className="pb-3 text-right font-semibold">Ação</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b border-[#f0f3f1] last:border-0"><td className="py-4"><p className="font-semibold text-[#29483a]">{row.name}</p><p className="mt-1 text-xs text-[#8a9991]">{row.category} · {row.phone}</p></td><td className="py-4 text-xs text-[#617169]">{row.city || "—"}{row.state ? ` · ${row.state}` : ""}<p className="mt-1 max-w-[170px] truncate text-[#9aa79f]">{row.address || "Endereço não informado"}</p></td><td className="py-4"><WhatsappBadge value={row.whatsappValid} /></td><td className="py-4"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-[#315c49]">{row.qualificationScore ?? "—"}</span>{row.qualificationStatus === "qualified" && <span className="text-[10px] text-[#8b9b92]">qualificado</span>}</div></td><td className="py-4 text-right"><Button size="sm" variant="outline" disabled={qualify.isPending || !row.id || !leads.data?.length} onClick={() => qualify.mutate({ id: row.id })} className="h-8 border-[#d9e5dc] text-xs text-[#39634e] hover:bg-[#edf5ef]">{qualify.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}Qualificar</Button></td></tr>)}</tbody></table></div></CardContent></Card>
      </div>
    </div>
  </DashboardLayout>;
}
