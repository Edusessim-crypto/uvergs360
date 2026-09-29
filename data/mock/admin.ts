/**
 * DADOS DE DEMONSTRAÇÃO — usuários internos, integrações, auditoria, metas e relatórios.
 */
import type { AuditLog, Goal, Integration, MonthlyPoint, User } from "@/types"
import { createRandom } from "@/lib/random"
import { monthShort } from "@/lib/format"
import { daysAgo, minutesAgo } from "./_clock"

export const CURRENT_USER = {
  id: "us-ricardo",
  name: "Ricardo Martins",
  role: "Administrador",
  organization: "Administração UVERGS",
  email: "ricardo.martins@uvergs.org.br",
}

export function buildUsers(): User[] {
  return [
    { id: "us-ricardo", name: "Ricardo Martins", email: "ricardo.martins@uvergs.org.br", role: "Administrador", status: "ativo", lastAccessAt: minutesAgo(2), area: "Diretoria executiva" },
    { id: "us-juliana", name: "Juliana Rocha", email: "juliana.rocha@uvergs.org.br", role: "Comunicação", status: "ativo", lastAccessAt: minutesAgo(26), area: "Comunicação institucional" },
    { id: "us-felipe", name: "Felipe Andrade", email: "felipe.andrade@uvergs.org.br", role: "Gestor", status: "ativo", lastAccessAt: minutesAgo(95), area: "Relacionamento com Câmaras" },
    { id: "us-camila", name: "Camila Teixeira", email: "camila.teixeira@uvergs.org.br", role: "Operador de eventos", status: "ativo", lastAccessAt: minutesAgo(8), area: "Eventos" },
    { id: "us-rodrigo", name: "Rodrigo Pacheco", email: "rodrigo.pacheco@uvergs.org.br", role: "Operador de eventos", status: "ativo", lastAccessAt: daysAgo(1, 18, 2), area: "Eventos" },
    { id: "us-patricia", name: "Patrícia Moraes", email: "patricia.moraes@uvergs.org.br", role: "Gestor", status: "ativo", lastAccessAt: daysAgo(2, 11, 40), area: "Financeiro" },
    { id: "us-leandro", name: "Leandro Quadros", email: "leandro.quadros@uvergs.org.br", role: "Leitura", status: "ativo", lastAccessAt: daysAgo(6, 9, 12), area: "Conselho fiscal" },
    { id: "us-beatriz", name: "Beatriz Camargo", email: "beatriz.camargo@uvergs.org.br", role: "Comunicação", status: "convidado", lastAccessAt: null, area: "Comunicação institucional" },
    { id: "us-otavio", name: "Otávio Lemos", email: "otavio.lemos@uvergs.org.br", role: "Operador de eventos", status: "suspenso", lastAccessAt: daysAgo(64, 14, 0), area: "Eventos" },
  ]
}

export function buildIntegrations(): Integration[] {
  return [
    { id: "int-email", name: "E-mail transacional", category: "Comunicação", description: "Envio de campanhas, confirmações de inscrição, credenciais e certificados.", providers: ["Resend", "Amazon SES"], status: "nao_configurado", capabilities: ["Campanhas", "Jornadas", "Confirmações"] },
    { id: "int-whatsapp", name: "WhatsApp", category: "Comunicação", description: "Mensagens oficiais via API do WhatsApp Business com templates aprovados.", providers: ["WhatsApp Cloud API"], status: "nao_configurado", capabilities: ["Lembretes", "Jornadas", "Atendimento"] },
    { id: "int-sms", name: "SMS", category: "Comunicação", description: "Lembretes curtos de evento e códigos de verificação.", providers: ["Zenvia", "Twilio"], status: "nao_configurado", capabilities: ["Lembretes D-1", "Verificação"] },
    { id: "int-pagamentos", name: "Pagamentos", category: "Financeiro", description: "Cobrança de inscrições via PIX, boleto e cartão com conciliação automática.", providers: ["Asaas", "Mercado Pago", "Pagar.me"], status: "nao_configurado", capabilities: ["PIX", "Boleto", "Webhooks"] },
    { id: "int-storage", name: "Armazenamento", category: "Infraestrutura", description: "Guarda de certificados, anexos, fotos de eventos e documentos das Câmaras.", providers: ["Amazon S3", "Cloudflare R2"], status: "nao_configurado", capabilities: ["Certificados PDF", "Anexos"] },
    { id: "int-analytics", name: "Analytics", category: "Dados", description: "Medição de acessos às landing pages e ao portal para o funil de eventos.", providers: ["Plausible", "Google Analytics 4"], status: "nao_configurado", capabilities: ["Funil", "Origem de tráfego"] },
  ]
}

export function buildAuditLogs(): AuditLog[] {
  const rnd = createRandom(404)
  const actors = [
    { name: "Ricardo Martins", role: "Administrador" },
    { name: "Juliana Rocha", role: "Comunicação" },
    { name: "Felipe Andrade", role: "Gestor" },
    { name: "Camila Teixeira", role: "Operador de eventos" },
    { name: "Sistema", role: "Automação" },
  ]
  const actions: { action: string; entity: string; label: () => string; severity: AuditLog["severity"] }[] = [
    { action: "Editou vereador", entity: "Vereador", label: () => rnd.pick(["Carlos Eduardo Martins", "Lucas Martins", "Renata Bortolini", "Paulo Zanella"]), severity: "info" },
    { action: "Exportou relatório", entity: "Relatório", label: () => rnd.pick(["Participações por região", "Inscrições do Seminário", "Certificados emitidos"]), severity: "alerta" },
    { action: "Enviou campanha", entity: "Campanha", label: () => rnd.pick(["Convite Seminário Gestão Pública", "Convite Encontro Regional Serra"]), severity: "info" },
    { action: "Alterou permissão", entity: "Usuário", label: () => rnd.pick(["Beatriz Camargo", "Otávio Lemos"]), severity: "critico" },
    { action: "Emitiu certificados em lote", entity: "Certificado", label: () => "Congresso Estadual UVERGS 2026", severity: "info" },
    { action: "Publicou evento", entity: "Evento", label: () => rnd.pick(["Seminário de Gestão Pública", "Encontro Regional Serra", "Encontro Regional Missões"]), severity: "info" },
    { action: "Login realizado", entity: "Sessão", label: () => "Acesso ao painel administrativo", severity: "info" },
    { action: "Tentativa de login falhou", entity: "Sessão", label: () => "Senha incorreta (3 tentativas)", severity: "alerta" },
    { action: "Atualizou Câmara", entity: "Câmara", label: () => rnd.pick(["Câmara Municipal de Gramado", "Câmara Municipal de Canela", "Câmara Municipal de Lajeado"]), severity: "info" },
  ]
  return Array.from({ length: 64 }, (_, i) => {
    const a = rnd.pick(actions)
    const actor = a.entity === "Certificado" ? actors[4] : rnd.pick(actors.slice(0, 4))
    return {
      id: `au-${i}`,
      actor: actor.name,
      actorRole: actor.role,
      action: a.action,
      entity: a.entity,
      entityLabel: a.label(),
      at: i === 0 ? minutesAgo(2) : daysAgo(Math.floor(i / 6), rnd.int(8, 19), rnd.int(0, 59)),
      ip: `177.${rnd.int(20, 220)}.${rnd.int(1, 254)}.${rnd.int(1, 254)}`,
      severity: a.severity,
    }
  }).sort((a, b) => b.at.localeCompare(a.at))
}

export function buildGoals(): Goal[] {
  return [
    { id: "gl-participantes", label: "Participantes", description: "Pessoas distintas presentes em eventos no ano", target: 6000, actual: 5284, unit: "número", category: "Participação", quarterly: q([1400, 1500, 1600, 1500], [1312, 1488, 1702, 782]) },
    { id: "gl-eventos", label: "Eventos", description: "Eventos realizados no ano", target: 48, actual: 42, unit: "número", category: "Eventos", quarterly: q([10, 12, 14, 12], [9, 13, 15, 5]) },
    { id: "gl-camaras", label: "Câmaras alcançadas", description: "Câmaras com ao menos uma participação", target: 497, actual: 487, unit: "número", category: "Território", quarterly: q([420, 450, 480, 497], [398, 441, 476, 487]) },
    { id: "gl-presenca", label: "Taxa de presença", description: "Presentes sobre inscritos confirmados", target: 85, actual: 82, unit: "percentual", category: "Eventos", quarterly: q([85, 85, 85, 85], [79, 83, 84, 82]) },
    { id: "gl-portal", label: "Portal ativado", description: "Vereadores com acesso ativo ao Meu UVERGS", target: 90, actual: 85, unit: "percentual", category: "Relacionamento", quarterly: q([70, 78, 85, 90], [66, 74, 83, 85]) },
    { id: "gl-certificados", label: "Certificados emitidos", description: "Certificados entregues no ano", target: 5500, actual: 4960, unit: "número", category: "Participação", quarterly: q([1300, 1400, 1500, 1300], [1204, 1391, 1622, 743]) },
    { id: "gl-nps", label: "NPS médio", description: "Satisfação média dos eventos", target: 75, actual: 72, unit: "número", category: "Eventos", quarterly: q([70, 72, 74, 75], [68, 71, 73, 72]) },
    { id: "gl-abertura", label: "Abertura de e-mails", description: "Taxa média de abertura das campanhas", target: 45, actual: 49, unit: "percentual", category: "Comunicação", quarterly: q([40, 42, 44, 45], [41, 46, 50, 49]) },
  ]
}

function q(targets: number[], actuals: number[]) {
  return targets.map((t, i) => ({ quarter: `T${i + 1}`, target: t, actual: actuals[i] }))
}

/** Série mensal (últimos 12 meses) — participações totalizam 6.284. */
export function buildMonthlySeries(): MonthlyPoint[] {
  const attendance = [388, 214, 402, 586, 634, 571, 498, 612, 707, 689, 571, 412]
  const rates = [0.8, 0.78, 0.81, 0.83, 0.82, 0.8, 0.84, 0.83, 0.82, 0.81, 0.84, 0.85]
  const now = new Date()
  return attendance.map((a, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { month: monthShort(d.getMonth()), attendance: a, registrations: Math.round(a / rates[i]) }
  })
}
