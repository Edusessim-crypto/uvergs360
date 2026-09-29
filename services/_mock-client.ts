/**
 * Cliente simulado usado por todos os serviços na Etapa 1.
 *
 * Etapa 2: substituir por um cliente HTTP (fetch/axios), server actions ou tRPC.
 * A assinatura assíncrona dos serviços já é a definitiva — os componentes
 * não precisam mudar.
 */
import { getDb, type MockDatabase } from "@/data/mock/db"
import { sleep } from "@/lib/utils"

export class ServiceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

function latency(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}

/** Leitura simulada: latência curta + cópia profunda (evita mutação acidental do "banco"). */
export async function mockRead<T>(select: (db: MockDatabase) => T, delay: [number, number] = [140, 360]): Promise<T> {
  await sleep(latency(...delay))
  return structuredClone(select(getDb()))
}

/** Escrita simulada: latência um pouco maior para exibir estados de carregamento. */
export async function mockWrite<T>(mutate: (db: MockDatabase) => T, delay: [number, number] = [520, 900]): Promise<T> {
  await sleep(latency(...delay))
  return structuredClone(mutate(getDb()))
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
