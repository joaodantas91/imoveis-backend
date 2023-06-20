import { type FastifyInstance } from 'fastify'
import { editProperty } from './controllers/editProperty'
import multipart from '@fastify/multipart'

export async function appRoutes (app: FastifyInstance): Promise<void> {
  void app.register(function (fastify, options, next) {
    void fastify.register(multipart)
    fastify.patch('/properties/:id', editProperty)
    next()
  })
}
