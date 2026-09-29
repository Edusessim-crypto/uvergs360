/**
 * Camada de serviços do UVERGS 360.
 *
 * Todos os componentes consomem dados exclusivamente por aqui.
 * Etapa 1: os serviços leem do banco simulado em /data/mock.
 * Etapa 2: cada função passa a chamar a API real — ver docs/BACKEND-ROADMAP.md.
 */
export { councilorService } from "./councilor.service"
export { chamberService } from "./chamber.service"
export { territoryService } from "./territory.service"
export { eventService } from "./event.service"
export { registrationService, checkinService } from "./registration.service"
export { certificateService, evaluationService } from "./certificate.service"
export { campaignService, journeyService, segmentService } from "./communication.service"
export { dashboardService, radarService, goalService, reportService } from "./analytics.service"
export { searchService, notificationService, sessionService, userService, integrationService, auditService } from "./platform.service"
export { portalService } from "./portal.service"
export { ServiceError } from "./_mock-client"

export type { InteractionInput, TaskInput, CommunicationRecord } from "./councilor.service"
export type { ChamberEventParticipation } from "./chamber.service"
export type { GeoCollection, GeoFeature } from "./territory.service"
export type { PublicRegistrationInput } from "./registration.service"
export type { RadarSignal, RadarRecommendation } from "./analytics.service"
export type { ParticipantHome, ChamberPortalHome } from "./portal.service"
