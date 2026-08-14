import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const fields = [
  ["apifyApiKey", "Apify API Key", "Token usado para coleta de dados"],
  ["n8nWebhookUrl", "n8n Webhook URL", "URL que inicia o workflow de coleta"],
  ["n8nWebhookToken", "n8n Webhook Token", "Token de autenticação do webhook"],
  ["openrouterApiKey", "OpenRouter API Key", "Chave para qualificação por IA"],
  ["evolutionApiUrl", "Evolution Go URL", "URL base da validação e envio"],
  ["evolutionApiKey", "Evolution Go API Key", "Chave da Evolution Go"],
  ["postgresUrl", "Postgres URL", "Conexão do banco operacional"],
  ["hasuraEndpoint", "Hasura GraphQL Endpoint", "Endpoint GraphQL opcional"],
  ["hasuraAdminSecret", "Hasura Admin Secret", "Segredo administrativo do Hasura"],
] as const;

type FieldKey = (typeof fields)[number][0];
type FormState = Record<FieldKey, string>;
const initialState = Object.fromEntries(fields.map(([key]) => [key, ""])) as FormState;
const secretField = (key: string) => key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key === "postgresUrl";

export default function Configuracoes() {
  const query = trpc.settings.integrations.useQuery();
  const utils = trpc.useUtils();
  const save = trpc.settings.saveIntegrations.useMutation({ onSuccess: () => { toast.success("Integração atualizada com segurança"); query.refetch(); }, onError: e => toast.error(e.message) });
  const remove = trpc.settings.removeIntegration.useMutation({ onSuccess: () => { toast.success("Credencial removida"); query.refetch(); }, onError: e => toast.error(e.message) });
  const [form, setForm] = useState<FormState>(initialState);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const configured = (query.data?.values ?? {}) as Record<string, unknown>;

  useEffect(() => { if (query.error) toast.error("Não foi possível carregar as configurações."); }, [query.error]);
  function update(key: FieldKey, value: string) { setForm(current => ({ ...current, [key]: value })); }
  function saveField(key: FieldKey) { if (!form[key].trim()) { toast.error("Digite um novo valor antes de salvar."); return; } save.mutate({ [key]: form[key] } as Partial<FormState>, { onSuccess: () => { setForm(current => ({ ...current, [key]: "" })); setEditing(null); } }); }
  function removeField(key: FieldKey, label: string) { if (!window.confirm(`Remover a configuração de ${label}? Esta ação não revela nem recupera o valor anterior.`)) return; remove.mutate({ field: key }); }

  return <DashboardLayout><div className="min-h-screen bg-background p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Centro de controle</p><h1 className="mt-2 font-serif text-4xl text-foreground">Configurações de APIs</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Gerencie cada integração separadamente. Você pode substituir ou remover uma credencial sem alterar as demais.</p><div className="mt-7 grid gap-7 xl:grid-cols-[1.5fr_0.7fr]"><Card className="border-0 shadow-sm"><CardHeader><CardTitle className="font-serif text-2xl font-normal">Integrações operacionais</CardTitle><p className="text-sm text-muted-foreground">Os valores salvos ficam criptografados no servidor e aparecem somente como máscara parcial.</p></CardHeader><CardContent><div className="space-y-3">{fields.map(([key, label, description]) => { const existing = String(configured[key] ?? ""); const isEditing = editing === key; return <div key={key} className="rounded-2xl border border-border bg-white p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-medium text-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{existing ? <span className="text-emerald-700">Configurado: {existing}</span> : description}</p></div><Badge className={existing ? "w-fit border-0 bg-indigo-100 text-indigo-700" : "w-fit border-0 bg-muted text-muted-foreground"}>{existing ? "Ativo" : "Não configurado"}</Badge></div>{(isEditing || !existing) && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={form[key]} onChange={e => update(key, e.target.value)} placeholder={existing ? "Digite o novo valor para substituir" : description} type={secretField(key) ? "password" : "text"} className="border-border bg-background" /><Button onClick={() => saveField(key)} disabled={save.isPending} className="bg-slate-950 hover:bg-indigo-600">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button></div>}{existing && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(isEditing ? null : key)} className="border-border text-foreground"><Pencil className="mr-2 h-3.5 w-3.5" />{isEditing ? "Cancelar edição" : "Editar / substituir"}</Button><Button variant="outline" size="sm" onClick={() => removeField(key, label)} disabled={remove.isPending} className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="mr-2 h-3.5 w-3.5" />Remover</Button></div>}</div>; })}</div></CardContent></Card><Card className="h-fit border-0 bg-slate-950 text-white shadow-sm"><CardContent className="p-6"><ShieldCheck className="h-7 w-7 text-indigo-200" /><h2 className="mt-5 font-serif text-2xl">Segurança por padrão.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Remover uma credencial limpa somente aquele campo. As outras integrações continuam intactas, e nenhum segredo completo é enviado para o navegador.</p><div className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Badge className="border-0 bg-white/10 text-indigo-100">{query.data?.configured ? "Configuração disponível" : "Aguardando configuração"}</Badge></div></CardContent></Card></div></div></DashboardLayout>;
}
