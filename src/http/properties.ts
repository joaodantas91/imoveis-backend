import { randomUUID, type UUID } from 'crypto'
import { type FastifyInstance } from 'fastify'// type FastifyRequest,
import { z } from 'zod'
import { knex } from '../database'
import multipart, { type MultipartFields } from '@fastify/multipart'
import { type PropertiesDTO, PropertyType, TransactionType, type Properties } from '../@types/properties'
import fs from 'fs'
import path from 'path'
import { type PropertiesImagesDTO, type PropertiesImages } from '../@types/properties-images'
import { env } from '../env'
import { flattenObject } from '../utils/flattenObject'
import { fileURLToPath } from 'url'
// import util from 'node:util'
// import { pipeline } from 'node:stream'

// import { } from '../@types/properties-images'
// const pump = util.promisify(pipeline)

function isEmpty (obj: Record<string, unknown>): boolean {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false
    }
  }

  return true
}

function getFileURL (filename: string): string {
  if (env.NODE_ENV === 'test') {
    return path.resolve(__dirname, `../../db/images-test/${filename}`)
  }
  return path.resolve(__dirname, `../../db/images/${filename}`)
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
  deletedImages?: { value: string[] }
  images?: {
    value: Array<{
      id: string
      order: number
    }>
  }
}

// interface PatchBody {
//   transactionType: TransactionType
//   type: PropertyType
//   price: number | undefined
//   title: string
//   description: string
//   address: {
//     street: string
//     postalCode: string
//     city: string
//     district: string
//   }
//   details: {
//     rooms?: number | undefined
//     baths?: number | undefined
//     garages?: number | undefined
//     area?: number | undefined
//   }
//   deletedImages?: string[]
//   imagesOrder?: Array<{
//     id: string
//     url: string
//     order: number
//   }>
// }

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
  rooms: z.coerce.number(z.number().optional()),
  baths: z.coerce.number(z.number().optional()),
  garages: z.coerce.number(z.number().optional()),
  area: z.coerce.number(z.number().optional())
})

const PropertyBodySchema = z.object({
  title: z.string(),
  transactionType: z.nativeEnum(TransactionType),
  type: z.nativeEnum(PropertyType),
  price: z.coerce.number(z.number().optional()),
  description: z.string(),
  address: addressSchema,
  details: detailsSchema
})

// const optionalPropertyBodySchema = z.object({
//   title: z.string().optional(),
//   transactionType: z.nativeEnum(TransactionType).optional(),
//   type: z.nativeEnum(PropertyType).optional(),
//   price: z.number().optional(),
//   description: z.string().optional(),
//   street: z.string().optional(),
//   postalCode: z.string().optional(),
//   city: z.string().optional(),
//   district: z.string().optional(),
//   rooms: z.number().optional(),
//   baths: z.number().optional(),
//   garages: z.number().optional(),
//   area: z.number().optional(),
//   imagesOrder: z.array(z.object({
//     id: z.string().optional(),
//     url: z.string().optional(),
//     order: z.number().optional()
//   })).optional(),
//   deletedImages: z.array(z.string()).optional()
// })

// function createObjectWithDefinedValues<T extends object> (obj: T): Partial<T> {
//   const result: Partial<T> = {}
//   // console.log({ obj })
//   for (const key in obj) {
//     if (Object.prototype.hasOwnProperty.call(obj, key)) {
//       const value = obj[key]
//       if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
//         const nestedResult = createObjectWithDefinedValues(value)
//         if (Object.keys(nestedResult).length > 0) {
//           // result[key] = nestedResult as T[Extract<keyof T, string>]
//           Object.assign(result, nestedResult)
//           // console.log({ value })
//         }
//       } else {
//         // console.log('aaaaaaaaaaaaaa', value)
//         result[key] = value
//       }
//     }
//   }
//   return result
// }

export async function propertiesRoutes (app: FastifyInstance): Promise<void> {
  app.get('/', async (_, reply) => {
    const leftJoin: Array<PropertiesDTO & Omit<PropertiesImagesDTO, 'id'> & { imageId: string }> = await knex
      .select(['p.*', 'pi.*', 'pi.id as imageId', 'p.id'])
      .from('properties as p')
      .leftJoin('properties-images as pi', 'p.id', 'pi.property_id')
    const groupedData: Record<string, Properties & { images: PropertiesImages[] }> = {} // Array<>

    leftJoin.forEach((item) => {
      const { id, imageId, propertyId, url, ...property } = item
      const image: PropertiesImages = { url: '', order: -1, id: '' }
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
        image.order = item.order
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
      const image: PropertiesImages = { url: '', order: -1, id: '' }
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
        image.id = imageId
        image.order = item.order
        groupedData[id].images.push(image)
      }
    })

    return await reply.status(200).send(Object.values(groupedData)[0])
  })

  function handleMultipartFields (_fields: MultipartFields): Partial<Body> {
    const fields: Partial<Body> = {}

    for (const key in _fields) {
      if (Object.prototype.hasOwnProperty.call(_fields, key)) {
        const field = _fields[key]
        if ((field != null) && !Array.isArray(field) && field.type === 'field') {
          Object.assign(fields, { [field.fieldname]: field.value })
        }
      }
    }
    return fields
  }

  void app.register(function (fastify, options, next) {
    void fastify.register(multipart)

    fastify.post('/', async (request, reply) => {
      // const safeNumberSchema = z.string().regex(/^\d+$/).transform(Number)
      const _files = await request.saveRequestFiles({ tmpdir: path.resolve(__dirname, '../../db/temp') })

      const fields = handleMultipartFields(_files[0].fields)
      console.log(fields)
      const parsedData = PropertyBodySchema.safeParse(fields)

      if (!parsedData.success) {
        console.error(JSON.stringify(parsedData.error.format()))
        return await reply.status(400).send({ error: parsedData.error.format() })
      }

      const propertyId = randomUUID()
      await knex('properties').insert({
        id: propertyId,
        ...flattenObject(parsedData.data)
      })

      if (_files.findIndex(file => file.mimetype.startsWith('image/')) === -1) {
        return await reply.status(415).send({ error: 'Formato de arquivo inválido, não é uma imagem!' })
      }

      const images: Image[] = _files.map(image => {
        const filename = randomUUID()
        const destinationFilePath = getFileURL(filename + path.extname(image.filename))
        void (async () => {
          fs.copyFile(path.win32.resolve(image.filepath), destinationFilePath, (err) => {
            if (err != null) throw err
          })
        })()
        return ({
          id: randomUUID(),
          property_id: propertyId,
          url: filename
        })
      })

      if (images.length > 0) {
        await knex('properties-images').insert(images)
      }

      return await reply.status(201).send({ id: propertyId })
    })
    next()
  })
  // void app.register(function (fastify, options, next) {
  //   void fastify.register(multipart)//, { attachFieldsToBody: 'keyValues', onFile }
  //   // const tmpUploads: string[] = []
  //   // fastify.decorateRequest('cleanRequestFiles', cleanRequestFiles)
  //   // fastify.addHook('onResponse', async (request, reply) => {
  //   //   await request.cleanRequestFiles()
  //   // })

  //   // async function cleanRequestFiles (): Promise<void> {
  //   //   if (!(tmpUploads.length > 0)) {
  //   //     return
  //   //   }
  //   //   for (const filepath of tmpUploads) {
  //   //     try {
  //   //       await unlink(filepath)
  //   //     } catch (error) {
  //   //       console.error(error, 'could not delete file')
  //   //     }
  //   //   }
  //   // }

  //   fastify.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
  //     const data = await knex('properties').select('id').where('id', request.params.id).first()

  //     if (data == null) {
  //       return await reply.status(404).send({ error: 'Property not found' })
  //     }

  //     const fields: Partial<PatchBody> = {}

  //     const parts = request.parts()
  //     try {
  //       for await (const part of parts) {
  //         if (part.type === 'file') {
  //           const filename = randomUUID()
  //           const imagePathname = new URL(`../../temp/${filename}${path.extname(part.filename)}`, import.meta.url).pathname

  //           await pump(
  //             part.file,
  //             fs.createWriteStream(imagePathname)
  //           )
  //           // tmpUploads.push(imagePathname)
  //           if (fields.imagesOrder != null && Array.isArray(fields.imagesOrder)) {
  //             fields.imagesOrder = [...fields.imagesOrder, {
  //               id: randomUUID(),
  //               order: Number(path.parse(part.filename).name),
  //               url: filename + path.extname(part.filename)
  //             }]
  //           }
  //         } else {
  //           function isValidFieldName (value: string): value is keyof typeof fields {
  //             return value in fields
  //           }
  //           const key = part.fieldname

  //           if (isValidFieldName(key)) {
  //             const fieldValue = fields[key]
  //             if (Array.isArray(part.value) && Array.isArray(fieldValue)) {
  //               Object.assign(fields, {
  //                 [key]: [...fieldValue, ...part.value]
  //               })
  //             } else {
  //               Object.assign(fields, {
  //                 [key]: part.value
  //               })
  //             }
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error({ error })
  //     }

  //     const parsedData = optionalPropertyBodySchema.safeParse(fields)

  //     if (!parsedData.success) {
  //       console.error(JSON.stringify(parsedData.error.format()))
  //       return await reply.status(400).send({ error: parsedData.error.format() })
  //     }

  //     fields.imagesOrder?.forEach((image) => {
  //       void (async () => {
  //         await knex('properties-images').insert(image)

  //         const originFilePath = new URL(`../../temp/${image.url}`, import.meta.url).pathname
  //         const destinationFilePath = getFileURL(image.url)

  //         fs.rename(originFilePath, destinationFilePath, (err) => {
  //           if (err != null) throw err
  //         })
  //       })()
  //     })

  //     try {
  //       parsedData.data.deletedImages?.forEach((imageId) => {
  //         void (async () => {
  //           const deleteImageResponse = await knex('properties-images').delete().where('id', imageId)
  //           console.log({ deleteImageResponse })
  //         })()
  //       })
  //     } catch (error) {
  //       console.error({ error })
  //       return await reply.status(500).send({ error })
  //     }

  //     try {
  //       parsedData.data.imagesOrder?.forEach((image) => {
  //         void (async () => {
  //           // console.log({ test: image })
  //           const updateOrderResponse = await knex('properties-images').where('id', image.id).update({ order: image.order != null && !isNaN(image.order) ? image.order : -1 })
  //           console.log({ updateOrderResponse })
  //         })()
  //       })
  //     } catch (error) {
  //       console.error({ error })
  //       return await reply.status(500).send({ error })
  //     }
  //     delete parsedData.data.deletedImages
  //     delete parsedData.data.imagesOrder
  //     await knex('properties').where('id', data.id).update(parsedData.data)

  //     return await reply.status(201).send()
  //   })
  //   next()
  // })
}
