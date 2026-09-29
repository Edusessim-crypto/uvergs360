/**
 * DADOS DE DEMONSTRAÇÃO — atividade recente, linha do tempo e tarefas.
 */
import type { ActivityItem, Certificate, Councilor, Registration, Task, TimelineItem, UvergsEvent } from "@/types"
import { createRandom, hashString } from "@/lib/random"
import { daysAgo, dayAt, minutesAgo, todayAt } from "./_clock"
import { EVENT_IDS } from "./events"
import { FEATURED_IDS } from "./people"

export function buildRecentActivity(councilors: Councilor[], events: UvergsEvent[]): ActivityItem[] {
  const rnd = createRandom(5150)
  const byId = new Map(councilors.map((c) => [c.id, c]))
  const name = (id: string) => byId.get(id)?.name ?? "—"
  const pool = councilors.filter((c) => c.situation === null)
  const seminario = events.find((e) => e.id === EVENT_IDS.seminario)!
  const capacitacao = events.find((e) => e.id === EVENT_IDS.capacitacao)!

  const fixed: ActivityItem[] = [
    { id: "at-1", kind: "inscricao", title: "Nova inscrição", subject: name(FEATURED_IDS.carlosMendes), context: seminario.title, at: todayAt(9, 42, 16), href: `/vereadores/${FEATURED_IDS.carlosMendes}` },
    { id: "at-2", kind: "checkin", title: "Check-in realizado", subject: name(FEATURED_IDS.mariana), context: capacitacao.title, at: todayAt(9, 35, 7), href: `/vereadores/${FEATURED_IDS.mariana}` },
    { id: "at-3", kind: "certificado", title: "Certificado emitido", subject: name(FEATURED_IDS.joao), context: "Congresso Estadual UVERGS 2026", at: todayAt(9, 18, 42), href: `/vereadores/${FEATURED_IDS.joao}` },
    { id: "at-4", kind: "pagamento", title: "Pagamento confirmado", subject: rnd.pick(pool).name, context: seminario.title, at: todayAt(9, 4, 58), href: `/eventos/${seminario.id}` },
    { id: "at-5", kind: "email", title: "Campanha concluída", subject: "Lembrete — Webinar Transparência e LGPD", context: "1.860 destinatários", at: todayAt(8, 30, 95), href: "/campanhas" },
    { id: "at-6", kind: "cadastro", title: "Câmara atualizou seus dados", subject: "Câmara Municipal de Gramado", context: "Telefone, presidente e endereço", at: daysAgo(1, 16, 20), href: "/camaras/cm-4309100" },
  ]

  const kinds: { kind: ActivityItem["kind"]; title: string }[] = [
    { kind: "inscricao", title: "Nova inscrição" },
    { kind: "pagamento", title: "Pagamento confirmado" },
    { kind: "email", title: "E-mail aberto" },
    { kind: "portal", title: "Portal ativado" },
    { kind: "cadastro", title: "Cadastro atualizado" },
    { kind: "whatsapp", title: "Resposta no WhatsApp" },
  ]
  const upcoming = events.filter((e) => e.status === "inscricoes_abertas")
  const generated: ActivityItem[] = Array.from({ length: 34 }, (_, i) => {
    const k = rnd.pick(kinds)
    const c = rnd.pick(pool)
    const ev = rnd.pick(upcoming)
    return {
      id: `at-g${i}`,
      kind: k.kind,
      title: k.title,
      subject: c.name,
      context: k.kind === "cadastro" ? c.chamberName : k.kind === "portal" ? "Meu UVERGS" : ev.title,
      at: daysAgo(1 + Math.floor(i / 5), rnd.int(8, 19), rnd.int(0, 59)),
      href: `/vereadores/${c.id}`,
    }
  })
  return [...fixed, ...generated].sort((a, b) => b.at.localeCompare(a.at))
}

/** Linha do tempo 360º — combina registros reais do "banco" com interações. */
export function buildTimeline(
  councilor: Councilor,
  registrations: Registration[],
  certificates: Certificate[],
  events: UvergsEvent[],
): TimelineItem[] {
  const rnd = createRandom(hashString(councilor.id))
  const items: TimelineItem[] = []
  const eventById = new Map(events.map((e) => [e.id, e]))
  const isCarlos = councilor.id === FEATURED_IDS.carlos

  for (const r of registrations.filter((r) => r.councilorId === councilor.id)) {
    const ev = eventById.get(r.eventId)
    items.push({
      id: `tl-ins-${r.id}`,
      kind: "inscricao",
      title: r.status === "incompleta" ? "Inscrição iniciada (não concluída)" : "Inscrição concluída",
      description: r.eventTitle,
      meta: r.status === "incompleta" ? "Parou na etapa de dados institucionais" : `Origem: ${r.origin}`,
      at: r.createdAt,
      href: ev ? `/eventos/${ev.id}` : undefined,
    })
    if (r.paymentStatus === "confirmado" && r.status !== "incompleta") {
      const at = new Date(r.createdAt)
      at.setHours(at.getHours() + 3)
      if (at.getTime() < Date.now() && !(isCarlos && r.eventId === EVENT_IDS.seminario)) {
        items.push({ id: `tl-pg-${r.id}`, kind: "pagamento", title: "Pagamento confirmado", description: r.eventTitle, meta: "PIX", at: at.toISOString() })
      }
    }
    if (r.checkedInAt) {
      items.push({ id: `tl-ck-${r.id}`, kind: "checkin", title: "Check-in registrado", description: r.eventTitle, meta: "Credencial digital", at: r.checkedInAt })
    }
  }

  const certEvents = new Set<string>()
  for (const c of certificates.filter((c) => c.councilorId === councilor.id && c.status === "emitido")) {
    certEvents.add(c.eventId)
    items.push({ id: `tl-ce-${c.id}`, kind: "certificado", title: "Certificado emitido", description: c.eventTitle, meta: `${c.workload}h · ${c.code}`, at: c.issuedAt, href: "/certificados" })
    const hasCheckin = items.some((i) => i.kind === "checkin" && i.description === c.eventTitle)
    if (!hasCheckin) {
      const ck = new Date(c.eventDate)
      ck.setHours(8, rnd.int(5, 55))
      items.push({ id: `tl-ck2-${c.id}`, kind: "checkin", title: "Check-in registrado", description: c.eventTitle, meta: "Credencial digital", at: ck.toISOString() })
    }
  }

  if (isCarlos) {
    items.push(
      { id: "tl-c1", kind: "email", title: "E-mail aberto", description: "Convite Seminário", meta: "Campanha · Convite Seminário Gestão Pública", at: daysAgo(1, 17, 14) },
      { id: "tl-c2", kind: "whatsapp", title: "WhatsApp respondido", description: "Confirmação de presença no Congresso", meta: "Canal preferido", at: daysAgo(34, 11, 2) },
      { id: "tl-c3", kind: "interacao", title: "Reunião registrada", description: "Visita institucional à Câmara de Gramado", meta: "Registrado por Ricardo Martins", at: daysAgo(55, 15, 30), actor: "Ricardo Martins" },
      { id: "tl-c4", kind: "cadastro", title: "Dados cadastrais atualizados", description: "Telefone e áreas de interesse", meta: "Via portal Meu UVERGS", at: daysAgo(69, 20, 12) },
      { id: "tl-c5", kind: "avaliacao", title: "Avaliação respondida", description: "Congresso Estadual UVERGS 2026", meta: "Nota 10 · Promotor", at: daysAgo(23, 21, 40) },
      { id: "tl-c6", kind: "portal", title: "Portal Meu UVERGS ativado", description: "Primeiro acesso realizado", meta: "Convite por WhatsApp", at: daysAgo(210, 18, 3) },
      { id: "tl-c7", kind: "email", title: "E-mail aberto", description: "Certificados disponíveis — Congresso 2026", meta: "Clicou em “Baixar certificado”", at: daysAgo(17, 9, 51) },
    )
  } else {
    const emailSubjects = ["Convite Seminário", "Boletim UVERGS", "Convite Encontro Regional", "Certificados disponíveis", "Pesquisa de satisfação"]
    const last = councilor.lastInteractionAt ? new Date(councilor.lastInteractionAt) : null
    if (last && !items.some((i) => Math.abs(new Date(i.at).getTime() - last.getTime()) < 60_000)) {
      items.push({ id: "tl-last", kind: councilor.preferredChannel === "WhatsApp" ? "whatsapp" : "email", title: councilor.preferredChannel === "WhatsApp" ? "Mensagem lida no WhatsApp" : "E-mail aberto", description: rnd.pick(emailSubjects), at: last.toISOString() })
    }
    const extra = rnd.int(2, 5)
    for (let i = 0; i < extra; i++) {
      const offset = rnd.int(20, 330)
      items.push({ id: `tl-x${i}`, kind: "email", title: "E-mail aberto", description: rnd.pick(emailSubjects), at: daysAgo(offset, rnd.int(8, 21), rnd.int(0, 59)) })
    }
    if (councilor.portalActive) {
      items.push({ id: "tl-portal", kind: "portal", title: "Portal Meu UVERGS ativado", description: "Primeiro acesso realizado", at: daysAgo(rnd.int(120, 500), rnd.int(8, 21), rnd.int(0, 59)) })
    }
    if (councilor.situation === "cadastro_incompleto") {
      items.push({ id: "tl-bounce", kind: "cadastro", title: "E-mail retornou", description: "Endereço inválido ou inexistente", meta: "Requer atualização cadastral", at: daysAgo(rnd.int(2, 20), 10, 5) })
    }
    items.push({ id: "tl-create", kind: "cadastro", title: "Cadastro criado", description: councilor.chamberName, meta: "Importação da base UVERGS", at: councilor.createdAt })
  }

  return items
    .filter((i) => new Date(i.at).getTime() <= Date.now())
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function buildTasks(councilors: Councilor[]): Task[] {
  const rnd = createRandom(66)
  const assignees = ["Ricardo Martins", "Juliana Rocha", "Felipe Andrade", "Camila Teixeira"]
  const carlos = councilors.find((c) => c.id === FEATURED_IDS.carlos)!
  const lucas = councilors.find((c) => c.id === FEATURED_IDS.lucas)!
  const base: Task[] = [
    { id: "tk-1", title: "Enviar programação completa do Seminário", assignee: "Juliana Rocha", dueAt: dayAt(1, 18, 0), status: "aberta", priority: "media", councilorId: carlos.id, councilorName: carlos.name },
    { id: "tk-2", title: "Convidar para o Encontro Regional Serra como debatedor", assignee: "Ricardo Martins", dueAt: dayAt(4, 12, 0), status: "aberta", priority: "alta", councilorId: carlos.id, councilorName: carlos.name },
    { id: "tk-3", title: "Confirmar dados de faturamento da Câmara", assignee: "Felipe Andrade", dueAt: daysAgo(6, 12, 0), status: "concluida", priority: "baixa", councilorId: carlos.id, councilorName: carlos.name },
    { id: "tk-4", title: "Retomar inscrição no Seminário por telefone", assignee: "Camila Teixeira", dueAt: dayAt(0, 16, 0), status: "aberta", priority: "alta", councilorId: lucas.id, councilorName: lucas.name },
  ]
  const pool = councilors.filter((c) => c.situation)
  const titles = ["Ligar para atualizar e-mail", "Enviar convite do Portal Meu UVERGS", "Apresentar calendário de eventos", "Agendar visita institucional", "Retomar contato após 90 dias"]
  for (let i = 0; i < 14; i++) {
    const c = rnd.pick(pool)
    base.push({
      id: `tk-g${i}`,
      title: rnd.pick(titles),
      assignee: rnd.pick(assignees),
      dueAt: dayAt(rnd.int(-3, 12), rnd.int(9, 18), 0),
      status: rnd.chance(0.25) ? "concluida" : "aberta",
      priority: rnd.pick(["alta", "media", "baixa"] as const),
      councilorId: c.id,
      councilorName: c.name,
    })
  }
  return base
}

export { minutesAgo }
