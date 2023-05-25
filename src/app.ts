import fastify from 'fastify'
import { knex } from './database'
import crypto from 'node:crypto'

import { propertiesRoutes } from './routes/properties'

export const app = fastify({ logger: true })

void app.register(propertiesRoutes, {
  prefix: 'properties'
})

app.get('/hello', async (request, reply) => {
  const properties = await knex('properties').insert({
    id: crypto.randomUUID(),
    title: 'casa teste'
  }).returning('*')

  return properties
})
