import { type FastifyReply, type FastifyRequest } from 'fastify'
import { PropertyType, TransactionType } from '../../@types/properties'
import { z } from 'zod'
import { knex } from '../../database'
import { env } from '../../env'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import util from 'node:util'
import { pipeline } from 'node:stream'

interface PatchBody {
  transactionType: TransactionType
  type: PropertyType
  price: number | undefined
  title: string
  description: string
  address: {
    street: string
    postalCode: string
    city: string
    district: string
  }
  details: {
    rooms?: number | undefined
    baths?: number | undefined
    garages?: number | undefined
    area?: number | undefined
  }
  deletedImages?: string[]
  imagesOrder?: Array<{
    id: string
    url: string
    order: number
  }>
}

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
  area: z.number().optional(),
  imagesOrder: z.array(z.object({
    id: z.string().optional(),
    url: z.string().optional(),
    order: z.number().optional()
  })).optional(),
  deletedImages: z.array(z.string()).optional()
})

function getFileURL (filename: string): string {
  if (env.NODE_ENV === 'test') {
    return new URL(`../../db/images-test/${filename}`, import.meta.url).pathname
  }
  return new URL(`../../db/images/${filename}`, import.meta.url).pathname
}

const pump = util.promisify(pipeline)

export async function editProperty (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<FastifyReply> {
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  const data = await knex('properties').select('id').where('id', request.params.id).first()

  if (data == null) {
    return await reply.status(404).send({ error: 'Property not found' })
  }

  const fields: Partial<PatchBody> = {}

  const parts = request.parts()
  try {
    for await (const part of parts) {
      if (part.type === 'file') {
        const filename = randomUUID()
        const imagePathname = new URL(`../../temp/${filename}${path.extname(part.filename)}`, import.meta.url).pathname

        await pump(
          part.file,
          fs.createWriteStream(imagePathname)
        )
        // tmpUploads.push(imagePathname)
        if (fields.imagesOrder != null && Array.isArray(fields.imagesOrder)) {
          fields.imagesOrder = [...fields.imagesOrder, {
            id: randomUUID(),
            order: Number(path.parse(part.filename).name),
            url: filename + path.extname(part.filename)
          }]
        }
      } else {
        function isValidFieldName (value: string): value is keyof typeof fields {
          return value in fields
        }
        const key = part.fieldname

        if (isValidFieldName(key)) {
          const fieldValue = fields[key]
          if (Array.isArray(part.value) && Array.isArray(fieldValue)) {
            Object.assign(fields, {
              [key]: [...fieldValue, ...part.value]
            })
          } else {
            Object.assign(fields, {
              [key]: part.value
            })
          }
        }
      }
    }
  } catch (error) {
    console.error({ error })
  }

  const parsedData = optionalPropertyBodySchema.safeParse(fields)

  if (!parsedData.success) {
    console.error(JSON.stringify(parsedData.error.format()))
    return await reply.status(400).send({ error: parsedData.error.format() })
  }

  fields.imagesOrder?.forEach((image) => {
    void (async () => {
      await knex('properties-images').insert(image)

      const originFilePath = new URL(`../../temp/${image.url}`, import.meta.url).pathname
      const destinationFilePath = getFileURL(image.url)

      fs.rename(originFilePath, destinationFilePath, (err) => {
        if (err != null) throw err
      })
    })()
  })

  try {
    parsedData.data.deletedImages?.forEach((imageId) => {
      void (async () => {
        const deleteImageResponse = await knex('properties-images').delete().where('id', imageId)
        console.log({ deleteImageResponse })
      })()
    })
  } catch (error) {
    console.error({ error })
    return await reply.status(500).send({ error })
  }

  try {
    parsedData.data.imagesOrder?.forEach((image) => {
      void (async () => {
        // console.log({ test: image })
        const updateOrderResponse = await knex('properties-images').where('id', image.id).update({ order: image.order != null && !isNaN(image.order) ? image.order : -1 })
        console.log({ updateOrderResponse })
      })()
    })
  } catch (error) {
    console.error({ error })
    return await reply.status(500).send({ error })
  }
  delete parsedData.data.deletedImages
  delete parsedData.data.imagesOrder
  await knex('properties').where('id', data.id).update(parsedData.data)

  return await reply.status(201).send()
}
