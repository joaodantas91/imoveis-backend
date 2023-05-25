import { randomUUID, type UUID } from 'crypto'
import { type FastifyInstance } from 'fastify'

import { z } from 'zod'
import { knex } from '../database'
import multipart from '@fastify/multipart'
import { PropertyType, TransactionType } from '../@types/properties'
import fs from 'node:fs'
import path from 'path'

// import { } from '../@types/properties-images'

interface Body {
  // [k in keyof Properties]: {
  //   value: Properties[k]
  // }
  // & {
  //   images: PropertiesImages[]
  // }
  transactionType: { value: TransactionType }
  type: { value: PropertyType }
  price: { value: number | undefined }
  title: { value: string }
  description: { value: string }
  address: {
    value: {
      street: string
      postalCode: string
      city: string
      district: string
    }
  }
  details: {
    value: {
      rooms?: number | undefined
      baths?: number | undefined
      garages?: number | undefined
      area?: number | undefined
    }
  }
}

interface Image {
  url: string
  id: UUID
  property_id: UUID
}

export async function propertiesRoutes (app: FastifyInstance): Promise<void> {
  app.get('/', async (_, reply) => {
    const properties = await reply.status(201).send(await knex('properties').select('*'))

    return await reply.status(200).send({ properties })
  })

  app.get('/:id', async (request, reply) => {
    const getPropertiesParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getPropertiesParamsSchema.parse(request.params)

    const property = await knex('properties').where('id', id).first()

    return await reply.status(200).send({ property })
  })

  void app.register(function (fastify, options, next) {
    void fastify.register(multipart)

    fastify.post('/', async (request, reply) => {
      // const safeNumberSchema = z.string().regex(/^\d+$/).transform(Number)

      const _files = await request.saveRequestFiles()
      // console.log(_files)
      const _fields = _files[0].fields
      // console.log(files)
      const fields: Partial<Omit<Body, 'images'>> = {}

      for (const key in _fields) {
        if (Object.prototype.hasOwnProperty.call(_fields, key)) {
          const field = _fields[key]
          if ((field != null) && !Array.isArray(field) && field.type === 'field') {
            Object.assign(fields, { [field.fieldname]: field.value })
          }
        }
      }

      const addressSchema = z.object({
        street: z.string(),
        postalCode: z.string(),
        city: z.string(),
        district: z.string()
      })

      const detailsSchema = z.object({
        rooms: z.number().optional(),
        baths: z.number().optional(),
        garages: z.number().optional(),
        area: z.number().optional()
      })

      const createPropertyBodySchema = z.object({
        title: z.string(),
        transactionType: z.nativeEnum(TransactionType),
        type: z.nativeEnum(PropertyType),
        price: z.number().optional(),
        description: z.string(),
        address: addressSchema,
        details: detailsSchema
      })

      const parsedData = createPropertyBodySchema.safeParse(fields)

      if (!parsedData.success) {
        console.error(JSON.stringify(parsedData.error.format()))
        return await reply.status(400).send({ error: parsedData.error.format() })
      }

      const {
        title,
        transactionType,
        type,
        price,
        description,
        details: {
          rooms, baths, garages, area
        },
        address: {
          city, district, postalCode, street
        }
      } = parsedData.data

      const propertyId = randomUUID()
      await knex('properties').insert({
        id: propertyId,
        title,
        transactionType,
        type,
        price,
        description,
        rooms,
        baths,
        garages,
        area,
        city,
        district,
        postalCode,
        street
      })

      if (_files.findIndex(file => {
        console.log(file.mimetype)
        return file.mimetype.startsWith('image/')
      }) !== -1) {
        return await reply.status(415).send({ error: 'Formato de arquivo inválido, não é uma imagem!' })
      }

      const images: Image[] = _files.map(image => {
        const filename = randomUUID()
        const destinationFilePath = getFileURL(filename + path.extname(image.filename))
        void (async () => {
          fs.copyFile(image.filepath, destinationFilePath, (err) => {
            if (err != null) throw err
          })
        })()
        return ({
          id: randomUUID(),
          property_id: propertyId,
          url: filename
        })
      })

      function getFileURL (filename: string): string {
        return new URL(`../../db/images/${filename}`, import.meta.url).pathname
      }

      if (images.length > 0) {
        await knex('properties-images').insert(images)
      }

      return await reply.status(201).send()
    })
    next()
  })
}
