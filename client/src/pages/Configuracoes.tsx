import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ShieldCheck } from "lucide-react";
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

type FormState = Record<(typeof fields)[number][0], string>;
const initialState = Object.fromEntries(fields.map(([key]) => [key, ""])) as FormState;

export default function Configuracoes() {
  const query = trpc.settings.integrations.useQuery();
  const save = trpc.settings.saveIntegrations.useMutation({ onSuccess: () => { toast.success("Configurações salvas com segurança"); query.refetch(); setForm(initialState); }, onError: e => toast.error(e.message) });
  const [form, setForm] = useState<FormState>(initialState);
  const configured = query.data?.values ?? {};

  useEffect(() => { if (query.error) toast.error("Não foi possível carregar as configurações."); }, [query.error]);
  function update(key: keyof FormState, value: string) { setForm(current => ({ ...current, [key]: value })); }

  return <DashboardLayout><div className="min-h-screen bg-[#f6f7f9] p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#719080]">Centro de controle</p><h1 className="mt-2 font-serif text-4xl text-[#18352a]">Configurações de APIs</h1><p className="mt-2 max-w-2xl text-sm text-[#708078]">Preencha as credenciais no próprio sistema. Os segredos são criptografados no servidor e nunca retornam completos para o navegador.</p><div className="mt-7 grid gap-7 xl:grid-cols-[1.5fr_0.7fr]"><Card className="border-0 shadow-sm"><CardHeader><CardTitle className="font-serif text-2xl font-normal">Integrações operacionais</CardTitle><p className="text-sm text-muted-foreground">Deixe um campo vazio para manter o valor atual. Depois de salvo, a chave aparece apenas mascarada.</p></CardHeader><CardContent><div className="grid gap-5 md:grid-cols-2">{fields.map(([key, label, description]) => { const existing = String((configured as Record<string, unknown>)[key] ?? ""); return <label key={key} className="space-y-2"><span className="text-sm font-medium text-[#29483a]">{label}</span><Input value={form[key]} onChange={e => update(key, e.target.value)} placeholder={existing || description} type={key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key === "postgresUrl" ? "password" : "text"} className="border-[#dce7df] bg-white" /><span className="block text-[11px] text-[#8a9991]">{existing ? <span className="text-emerald-700">Configurado: {existing}</span> : description}</span></label>; })}</div><Button onClick={() => save.mutate(form)} disabled={save.isPending} className="mt-7 bg-[#18352a] hover:bg-[#285642]">{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar configurações</Button></CardContent></Card><Card className="h-fit border-0 bg-[#18352a] text-white shadow-sm"><CardContent className="p-6"><ShieldCheck className="h-7 w-7 text-[#b7dbc4]" /><h2 className="mt-5 font-serif text-2xl">Segurança por padrão.</h2><p className="mt-3 text-sm leading-6 text-[#b8cabe]">As chaves são criptografadas antes de serem gravadas. A interface recebe somente status e máscara parcial, nunca o segredo integral.</p><div className="mt-6 flex items-center gap-2 text-xs text-[#9ec0a9]"><Badge className="border-0 bg-white/10 text-[#c9e5d1]">{query.data?.configured ? "Integração configurada" : "Aguardando configuração"}</Badge></div></CardContent></Card></div></div></DashboardLayout>;
}
