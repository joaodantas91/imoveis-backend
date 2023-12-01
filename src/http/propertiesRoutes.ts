import { type FastifyInstance } from 'fastify'// type FastifyRequest,
import multipart from '@fastify/multipart'
import { editProperty } from './controllers/editProperty'
import { createProperty } from './controllers/createProperty'
import { getProperties } from './controllers/getProperties'
import { getProperty } from './controllers/getProperty'

export async function propertiesRoutes (app: FastifyInstance): Promise<void> {
  app.get('/', getProperties)

  app.get('/:id', getProperty)

  void app.register(function (fastify, options, next) {
    void fastify.register(multipart)

    fastify.post('/', createProperty)
    fastify.patch('/:id', editProperty)
    next()
  })
}
