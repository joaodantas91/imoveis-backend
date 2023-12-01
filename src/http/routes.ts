import { type FastifyInstance } from 'fastify'
import { propertiesRoutes } from './propertiesRoutes'

export async function appRoutes (app: FastifyInstance): Promise<void> {
  void app.register(propertiesRoutes, {
    prefix: 'properties'
  })
}
