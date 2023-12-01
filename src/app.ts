import fastify from 'fastify'
import { knex } from './database'
import crypto from 'node:crypto'
import { appRoutes } from './http/routes'

export const app = fastify() // { logger: true }

void app.register(appRoutes)

app.get('/hello', async (request, reply) => {
  const properties = await knex('properties').insert({
    id: crypto.randomUUID(),
    title: 'casa teste'
  }).returning('*')

  return properties
})
