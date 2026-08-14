import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Users, ShieldCheck, Sparkles, Download, Play, ArrowUpRight, Loader2, CheckCircle2, Clock3, XCircle, FileSpreadsheet } from "lucide-react";
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
  const [exportScore, setExportScore] = useState("70");
  const [exportWhatsapp, setExportWhatsapp] = useState<"all" | "valid" | "invalid" | "pending">("valid");
  const [form, setForm] = useState({ niche: "", city: "", state: "", region: "", cep: "", leadLimit: 50 });

  const metrics = trpc.dashboard.metrics.useQuery(undefined, { retry: false });
  const leads = trpc.leads.list.useQuery({ search: search || undefined, city: city || undefined, state: state || undefined, region: region || undefined, niche: niche || undefined, whatsapp: whatsapp === "all" ? undefined : whatsapp, minScore: Number(minScore) || undefined }, { retry: false });
  const createSearch = trpc.searches.create.useMutation({ onSuccess: result => toast.success(result.message), onError: error => toast.error(error.message) });
  const qualify = trpc.leads.qualify.useMutation({ onSuccess: () => { toast.success("Lead qualificado com IA"); leads.refetch(); metrics.refetch(); }, onError: error => toast.error(error.message) });
  const exportCsv = trpc.leads.exportCsv.useQuery({ minScore: Number(exportScore), whatsapp: exportWhatsapp }, { enabled: false });

  const rows = useMemo(() => (leads.data ?? []).slice(0, 8), [leads.data]);
  const data = metrics.data ?? { total: 0, whatsappValid: 0, qualified: 0, ready: 0, validRate: 0 };

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!form.niche.trim()) return toast.error("Informe um nicho para iniciar a busca.");
    if (form.leadLimit < 1 || form.leadLimit > 500) return toast.error("O limite deve ficar entre 1 e 500 leads.");
    createSearch.mutate({ ...form, cep: form.cep.replace(/\D/g, "") || undefined });
  }

  async function downloadCsv() {
    const result = await exportCsv.refetch();
    if (result.error) return toast.error("Não foi possível gerar a exportação. Tente novamente.");
    if (!result.data || result.data.count === 0) return toast.info(`Nenhum lead com WhatsApp ${exportWhatsapp === "all" ? "em qualquer status" : exportWhatsapp} e score mínimo de ${exportScore} foi encontrado.`);
    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = result.data.filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    toast.success(`${result.data.count} lead(s) exportado(s) com score mínimo de ${exportScore}.`);
  }

  return <DashboardLayout>
    <div className="min-h-screen bg-background px-5 py-6 text-foreground md:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">SDEBR / Central operacional</p><h1 className="font-serif text-4xl tracking-tight text-foreground">Prospecção com clareza.</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Capture sinais de intenção, valide contatos e concentre energia nos leads que merecem uma conversa.</p></div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <div className="rounded-full border border-border bg-white px-3 py-2 text-xs text-muted-foreground"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Sistema conectado</div>
          <div className="flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-white p-1.5 shadow-sm sm:w-auto">
            <label className="hidden pl-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:block">Score mínimo</label>
            <Select value={exportScore} onValueChange={setExportScore}>
              <SelectTrigger aria-label="Score mínimo" className="h-9 w-[86px] border-0 bg-transparent text-xs shadow-none focus:ring-0 sm:w-[112px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="70">70+ Bons</SelectItem><SelectItem value="80">80+ Fortes</SelectItem><SelectItem value="90">90+ Top</SelectItem></SelectContent>
            </Select>
            <Select value={exportWhatsapp} onValueChange={value => setExportWhatsapp(value as typeof exportWhatsapp)}>
              <SelectTrigger aria-label="Status do WhatsApp" className="h-9 w-[92px] border-0 bg-transparent text-xs shadow-none focus:ring-0 sm:w-[132px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="valid">Válidos</SelectItem><SelectItem value="all">Todos</SelectItem><SelectItem value="pending">Pendentes</SelectItem><SelectItem value="invalid">Inválidos</SelectItem></SelectContent>
            </Select>
            <Button onClick={downloadCsv} disabled={exportCsv.isFetching} size="sm" className="h-9 flex-1 bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 sm:flex-none">{exportCsv.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}{exportCsv.isFetching ? "Preparando…" : "Exportar leads"}</Button>
          </div>
        </div>
      </header>

      {(metrics.isLoading || leads.isLoading) && <div className="mb-5 rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">Atualizando a operação…</div>}
      {(metrics.error || leads.error) && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Não foi possível atualizar os dados agora. Verifique a conexão com o banco e tente novamente.</div>}
      {!leads.isLoading && !leads.error && rows.length === 0 && <div className="mb-5 rounded-xl border border-dashed border-border bg-muted px-4 py-3 text-sm text-muted-foreground">A base ainda não recebeu leads. Inicie uma coleta ou aguarde o webhook do n8n.</div>}

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Leads coletados", value: data.total.toLocaleString("pt-BR"), icon: Users, note: "+18,4% este mês", tone: "text-indigo-700 bg-emerald-100" }, { label: "WhatsApp válido", value: `${data.validRate}%`, icon: ShieldCheck, note: `${data.whatsappValid} contatos prontos`, tone: "text-cyan-700 bg-cyan-100" }, { label: "Qualificados por IA", value: data.qualified.toLocaleString("pt-BR"), icon: Sparkles, note: "score médio 78", tone: "text-amber-700 bg-amber-100" }, { label: "Prontos para envio", value: data.ready.toLocaleString("pt-BR"), icon: ArrowUpRight, note: "com consentimento operacional", tone: "text-violet-700 bg-violet-100" }].map(item => <Card key={item.label} className="border-0 bg-white shadow-sm"><CardContent className="p-5"><div className="mb-6 flex items-start justify-between"><span className={`rounded-xl p-2.5 ${item.tone}`}><item.icon className="h-5 w-5" /></span><span className="text-[11px] font-medium text-muted-foreground">{item.note}</span></div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p></CardContent></Card>)}
      </section>

      <div className="grid gap-7 xl:grid-cols-[0.92fr_1.55fr]">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-[0_24px_60px_-32px_rgba(30,41,99,0.95)]"><div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl" /><CardHeader className="relative p-5 pb-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/15 text-indigo-200"><MapPin className="h-5 w-5" /></div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-200">Nova coleta</p><CardTitle className="font-serif text-3xl font-normal tracking-tight">Encontre o próximo lote.</CardTitle><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Defina seu nicho, limite e localização. O SDEBR encaminha os filtros ao n8n para acionar o Apify com mais precisão.</p></div><Badge className="hidden border-0 bg-white/10 text-indigo-100 sm:flex"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Busca inteligente</Badge></div></CardHeader><CardContent className="relative p-5 pt-1 sm:p-6 sm:pt-1"><form onSubmit={submitSearch} className="space-y-4"><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Nicho de atuação</label><Input required value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })} placeholder="Ex.: dentista, imobiliária, restaurante" className="h-11 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-300" /></div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_88px]"><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Cidade</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ex.: São Paulo" className="h-11 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-300" /></div><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">UF</label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SP" maxLength={2} className="h-11 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-300" /></div></div><div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">CEP exato <span className="font-normal normal-case tracking-normal text-slate-500">(opcional)</span></label><Input value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value.replace(/\D/g, "").slice(0, 8) })} inputMode="numeric" placeholder="00000-000" className="h-11 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-300" /><p className="mt-1.5 text-[10px] text-slate-400">Prioriza este ponto no mapa.</p></div><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Limite de leads</label><Input required type="number" min={1} max={500} value={form.leadLimit} onChange={e => setForm({ ...form, leadLimit: Number(e.target.value) || 0 })} placeholder="50" className="h-11 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-300" /><p className="mt-1.5 text-[10px] text-slate-400">De 1 até 500 resultados.</p></div></div><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Região ou bairro <span className="font-normal normal-case tracking-normal text-slate-500">(opcional)</span></label><Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Ex.: Pinheiros, Centro ou Zona Sul" className="h-11 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-300" /></div><Button disabled={createSearch.isPending} className="mt-2 h-12 w-full bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400">{createSearch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Disparar coleta no Apify</Button></form><div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Apify · n8n · Postgres sincronizados</span><span className="text-slate-500">CEP + nicho + limite aplicados</span></div></CardContent></Card>

        <Card className="border-0 bg-white shadow-sm"><CardHeader className="flex flex-col gap-4 p-6 pb-3 md:flex-row md:items-end md:justify-between"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Base de leads</p><CardTitle className="font-serif text-2xl font-normal text-foreground">Leads em movimento</CardTitle></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead" className="h-9 w-44 border-border pl-9 text-xs" /></div><Select value={whatsapp} onValueChange={value => setWhatsapp(value as typeof whatsapp)}><SelectTrigger className="h-9 w-32 border-border text-xs"><SelectValue placeholder="WhatsApp" /></SelectTrigger><SelectContent><SelectItem value="all">WhatsApp</SelectItem><SelectItem value="valid">Válido</SelectItem><SelectItem value="invalid">Inválido</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-6 pt-2"><div className="mb-4 grid gap-2 sm:grid-cols-4"><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Filtrar cidade" className="h-9 border-border text-xs" /><Input value={state} onChange={e => setState(e.target.value)} placeholder="UF" className="h-9 border-border text-xs" /><Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Região" className="h-9 border-border text-xs" /><Input value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="Score mín." type="number" className="h-9 border-border text-xs" /><Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Nicho" className="h-9 border-border text-xs" /></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><th className="pb-3 font-semibold">Lead</th><th className="pb-3 font-semibold">Localização</th><th className="pb-3 font-semibold">WhatsApp</th><th className="pb-3 font-semibold">Score IA</th><th className="pb-3 text-right font-semibold">Ação</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-b border-border last:border-0"><td className="py-4"><p className="font-semibold text-foreground">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.category} · {row.phone}</p></td><td className="py-4 text-xs text-muted-foreground">{row.city || "—"}{row.state ? ` · ${row.state}` : ""}<p className="mt-1 max-w-[170px] truncate text-muted-foreground">{row.address || "Endereço não informado"}</p></td><td className="py-4"><WhatsappBadge value={row.whatsappValid} /></td><td className="py-4"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-indigo-700">{row.qualificationScore ?? "—"}</span>{row.qualificationStatus === "qualified" && <span className="text-[10px] text-muted-foreground">qualificado</span>}</div></td><td className="py-4 text-right"><Button size="sm" variant="outline" disabled={qualify.isPending || !row.id || !leads.data?.length} onClick={() => qualify.mutate({ id: row.id })} className="h-8 border-border text-xs text-foreground hover:bg-indigo-50">{qualify.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}Qualificar</Button></td></tr>)}</tbody></table></div></CardContent></Card>
      </div>
    </div>
  </DashboardLayout>;
}
