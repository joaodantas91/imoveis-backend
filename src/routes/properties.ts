import { randomUUID, type UUID } from 'crypto'
import { type FastifyRequest, type FastifyInstance } from 'fastify'

import { z } from 'zod'
import { knex } from '../database'
import multipart from '@fastify/multipart'
import { type PropertiesDTO, PropertyType, TransactionType, type Properties } from '../@types/properties'
import fs from 'node:fs'
import path from 'path'
import { type PropertiesImagesDTO, type PropertiesImages } from '../@types/properties-images'
import { env } from '../env'

// import { } from '../@types/properties-images'

function isEmpty (obj: Record<string, unknown>): boolean {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false
    }
  }

  return true
}

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

const PropertyBodySchema = z.object({
  title: z.string(),
  transactionType: z.nativeEnum(TransactionType),
  type: z.nativeEnum(PropertyType),
  price: z.number().optional(),
  description: z.string(),
  address: addressSchema,
  details: detailsSchema
})

const optionalPropertyBodySchema = z.object({
  title: z.string().optional(),
  transactionType: z.nativeEnum(TransactionType).optional(),
  type: z.nativeEnum(PropertyType).optional(),
  price: z.number().optional(),
  description: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  rooms: z.number().optional(),
  baths: z.number().optional(),
  garages: z.number().optional(),
  area: z.number().optional()
})

function createObjectWithDefinedValues<T extends object> (obj: T): Partial<T> {
  const result: Partial<T> = {}
  // console.log({ obj })
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (typeof value === 'object' && value !== null) {
        const nestedResult = createObjectWithDefinedValues(value)
        if (Object.keys(nestedResult).length > 0) {
          // result[key] = nestedResult as T[Extract<keyof T, string>]
          Object.assign(result, nestedResult)
          // console.log({ value })
        }
      } else {
        // console.log('aaaaaaaaaaaaaa', value)
        result[key] = value
      }
    }
  }
  return result
}

export async function propertiesRoutes (app: FastifyInstance): Promise<void> {
  app.get('/', async (_, reply) => {
    const leftJoin: Array<PropertiesDTO & Omit<PropertiesImagesDTO, 'id'> & { imageId: string }> = await knex
      .select(['p.*', 'pi.*', 'pi.id as imageId', 'p.id'])
      .from('properties as p')
      .leftJoin('properties-images as pi', 'p.id', 'pi.property_id')
    const groupedData: Record<string, Properties & { images: PropertiesImages[] }> = {} // Array<>

    leftJoin.forEach((item) => {
      const { id, imageId, propertyId, url, ...property } = item
      const image: PropertiesImages = { url: '' }
      const { city, street, district, postalCode, area, baths, garages, rooms, ...nonNestedValues } = property

      if (isEmpty({ ...groupedData[id] })) {
        groupedData[id] = {
          ...nonNestedValues,
          address: {
            city, street, district, postalCode
          },
          details: {
            area, baths, garages, rooms
          },
          images: []
        }
      }

      if ((url != null) && url.length > 0) {
        image.url = item.url
        groupedData[id].images.push(image)
      }
    })

    return await reply.status(200).send(Object.values(groupedData))
  })

  app.get('/:id', async (request, reply) => {
    const getPropertiesParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getPropertiesParamsSchema.parse(request.params)

    // const property = await knex('properties').where('id', id).first()

    const leftJoin: Array<PropertiesDTO & Omit<PropertiesImagesDTO, 'id'> & { imageId: string }> = await knex
      .select(['p.*', 'pi.*', 'pi.id as imageId', 'p.id'])
      .from('properties as p')
      .leftJoin('properties-images as pi', 'p.id', 'pi.property_id').where('p.id', id)

    const groupedData: Record<string, Properties & { images: PropertiesImages[] }> = {}
    leftJoin.forEach((item) => {
      const { id, imageId, propertyId, url, ...property } = item
      const image: PropertiesImages = { url: '' }
      const { city, street, district, postalCode, area, baths, garages, rooms, ...nonNestedValues } = property

      if (isEmpty({ ...groupedData[id] })) {
        groupedData[id] = {
          ...nonNestedValues,
          address: {
            city, street, district, postalCode
          },
          details: {
            area, baths, garages, rooms
          },
          images: []
        }
      }

      if ((url != null) && url.length > 0) {
        image.url = item.url
        groupedData[id].images.push(image)
      }
    })
    console.log(groupedData)
    return await reply.status(200).send(Object.values(groupedData))
  })

  app.patch('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: Partial<Properties> }>, reply) => {
    const data = await knex('properties').select('id').where('id', request.params.id).first()
    if (data == null) {
      return await reply.status(404).send({ error: 'Property not found' })
    }

    const parsedData = optionalPropertyBodySchema.safeParse(createObjectWithDefinedValues(request.body))
    if (!parsedData.success) {
      console.error(JSON.stringify(parsedData.error.format()))
      return await reply.status(400).send({ error: parsedData.error.format() })
    }
    console.log({ parsedData: parsedData.data })
    console.log(await knex('properties').where('id', data.id).update(parsedData.data))
  })

  void app.register(function (fastify, options, next) {
    void fastify.register(multipart)

    fastify.post('/', async (request, reply) => {
      // const safeNumberSchema = z.string().regex(/^\d+$/).transform(Number)

      const _files = await request.saveRequestFiles()
      const _fields = _files[0].fields
      const fields: Partial<Omit<Body, 'images'>> = {}

      for (const key in _fields) {
        if (Object.prototype.hasOwnProperty.call(_fields, key)) {
          const field = _fields[key]
          if ((field != null) && !Array.isArray(field) && field.type === 'field') {
            Object.assign(fields, { [field.fieldname]: field.value })
          }
        }
      }

      const parsedData = PropertyBodySchema.safeParse(fields)

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

      if (_files.findIndex(file => file.mimetype.startsWith('image/')) === -1) {
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
        if (env.NODE_ENV === 'test') {
          return new URL(`../../db/images-test/${filename}`, import.meta.url).pathname
        }
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
