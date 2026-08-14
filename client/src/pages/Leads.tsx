import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Leads() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [minScore, setMinScore] = useState("");
  const query = trpc.leads.list.useQuery({ search: search || undefined, minScore: minScore ? Number(minScore) : undefined }, { retry: false });
  const rows = (query.data ?? []).filter(row => !region || (row.region ?? "").toLowerCase().includes(region.toLowerCase()));
  return <DashboardLayout><div className="min-h-screen bg-[#f6f7f9] p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#719080]">Base operacional</p><h1 className="mt-2 font-serif text-4xl text-[#18352a]">Todos os leads</h1><p className="mt-2 text-sm text-[#708078]">Pesquise, refine por score e localidade e abra o próximo tratamento.</p><Card className="mt-7 border-0 shadow-sm"><CardHeader><CardTitle className="font-serif text-2xl font-normal">Filtros de prospecção</CardTitle><div className="grid gap-3 pt-3 md:grid-cols-3"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, telefone ou nicho" /><Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Região" /><Input value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="Score mínimo" type="number" /></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="pb-3">Lead</th><th className="pb-3">Contato</th><th className="pb-3">Localidade</th><th className="pb-3">WhatsApp</th><th className="pb-3">Score</th></tr></thead><tbody>{rows.map(row => <tr className="border-b last:border-0" key={row.id}><td className="py-4 font-semibold">{row.name}<p className="text-xs font-normal text-muted-foreground">{row.category}</p></td><td className="py-4">{row.phone}<p className="text-xs text-muted-foreground">{row.website || "Sem site"}</p></td><td className="py-4">{row.city || "—"} · {row.state || "—"}<p className="text-xs text-muted-foreground">{row.region || "Região não informada"}</p></td><td className="py-4"><Badge>{row.whatsappValid === true ? "Válido" : row.whatsappValid === false ? "Inválido" : "Pendente"}</Badge></td><td className="py-4 font-semibold">{row.qualificationScore ?? "—"}</td></tr>)}</tbody></table>{!query.isLoading && !rows.length && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum lead encontrado com esses filtros.</p>}</div></CardContent></Card></div></DashboardLayout>;
}
