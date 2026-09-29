# UVERGS 360 — Roadmap de backend (Etapa 2)

Todos os componentes consomem dados **somente** via `services/*`. Hoje cada serviço lê
o banco simulado em `data/mock/db.ts` (via `services/_mock-client.ts`). Na Etapa 2,
troque o corpo de cada função pela chamada real — a interface não muda.
As chaves de cache estão em `lib/query-keys.ts` (React Query).

| Módulo | Hoje | Futuro |
|---|---|---|
| Sessão / usuários | `sessionService`, usuário fixo | Auth.js/Clerk, RBAC por papel, `GET /api/users`, convites |
| Vereadores / Perfil 360º | `councilorService` (mock, filtros no cliente) | `GET/POST/PATCH /api/councilors`, paginação no servidor, timeline agregada |
| Câmaras | `chamberService` | `GET/PATCH /api/chambers/:id` |
| Território | `territoryService`; malha IBGE estática em `public/geo` | Agregações no PostgreSQL / PostGIS |
| Eventos / Evento 360 | `eventService` (funil e origens simulados) | `GET /api/events/:id/dashboard`, analytics da landing |
| Inscrições / pagamentos | `registrationService` | API pública de inscrição, PIX/boleto (Asaas/Mercado Pago), webhooks |
| Check-in | `checkinService.scan` simula a leitura | Câmera (getUserMedia + leitor QR), token assinado, sincronização offline |
| Certificados | `certificateService` | Geração de PDF em fila, storage S3/R2, validação pública por código |
| Avaliações / NPS | `evaluationService` | Formulário público, agregação no banco |
| Campanhas | `campaignService` (envio simulado) | Resend, WhatsApp Cloud API, SMS (Zenvia/Twilio), BullMQ, webhooks de entrega |
| Jornadas | `journeyService` | Motor de automação por eventos de domínio + filas com atraso |
| Segmentos | `segmentService.estimate` (fórmula simulada) | Regras → SQL, `POST /api/segments/estimate` |
| Busca ⌘K | `searchService` | Full-text PostgreSQL (pg_trgm + unaccent) |
| Notificações | `notificationService` | SSE/WebSocket |
| Relatórios / exportação | `reportService.export` (feedback visual) | Geração assíncrona PDF/XLSX |
| Integrações | Cards "Não configurado" | Cofre de credenciais por provedor |

## Estado da Etapa 1
- **Pronto:** design system, dados simulados coerentes, todos os serviços, shell (sidebar, topbar, ⌘K, notificações) e Dashboard.
- **Pendente:** Radar, Perfil 360º, Território, Evento 360, listas (Vereadores, Câmaras, Eventos, Inscrições, Certificados), wizards, Check-in, Campanhas/Jornadas/Segmentos, portais e landing.
  Rotas sem tela exibem "Módulo em finalização" (`app/(admin)/[...slug]`).
