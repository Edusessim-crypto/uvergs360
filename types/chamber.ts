import type { RegionId } from "./territory"

export type ChamberStatus = "atualizada" | "desatualizada" | "pendente"

export interface Chamber {
  id: string
  name: string
  municipalityId: string
  municipalityName: string
  regionId: RegionId
  regionName: string
  phone: string
  email: string
  website: string
  address: string
  president: string
  presidentId: string | null
  adminContact: string
  adminContactRole: string
  councilorsCount: number
  participantsYear: number
  eventsCount: number
  certificatesCount: number
  dataQuality: number
  updatedAt: string
  status: ChamberStatus
  portalActive: boolean
}
