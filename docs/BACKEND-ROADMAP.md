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

## Estado da Etapa 1 (concluída)

Front-end demonstrável com navegação completa e dados simulados:

- **Telas hero:** Dashboard, Radar UVERGS, Perfil 360º, Território RS (malha real IBGE com drill-down Estado → Região → Município → Câmara → Vereadores) e Evento 360.
- **Relacionamento:** Vereadores (filtros, ordenação, seleção em lote, cadastro/edição em drawer), Câmaras e Perfil da Câmara, Segmentos (construtor de regras com estimativa), Atividades.
- **Comunicação:** Campanhas (wizard de 6 etapas com preview desktop/mobile/WhatsApp), Jornadas (fluxo visual).
- **Eventos:** lista, wizard de 7 etapas, Inscrições, Check-in simulado, Certificados (modal institucional com QR), Avaliações/NPS.
- **Gestão e administração:** Metas & Impacto, Relatórios (visualizar/exportar), Usuários, Integrações, Auditoria, Configurações, Notificações.
- **Área externa:** Meu UVERGS (mobile-first, credencial digital), Portal da Câmara, landing pública do evento e inscrição pública com credencial.

Todas as mutações (novo vereador, check-in, campanha, inscrição pública, tarefas, interações) ficam em memória até recarregar a página.

## Pontos de atenção para a Etapa 2
- Autenticação: não há tela de login na demonstração; o usuário "Ricardo Martins" é fixo (`sessionService`).
- Listas grandes (4.812 vereadores) são filtradas no cliente — mover filtros/paginação para a API.
- Datas dos dados simulados são relativas ao dia atual (`data/mock/_clock.ts`).
- Logo provisório em `components/brand/logo.tsx` — substituir pelo arquivo oficial da UVERGS.
