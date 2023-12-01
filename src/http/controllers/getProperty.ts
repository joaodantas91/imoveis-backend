import { type FastifyRequest, type FastifyReply } from 'fastify'
import { z } from 'zod'
import { type PropertiesImages } from '../../@types/properties-images'
import { type DatabasePropertiesReturnType, type Properties } from '../../@types/properties'
import { knex } from '../../database'
import { isObjectEmpty } from '../../utils/isObjectEmpty'

export async function getProperty (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const getPropertiesParamsSchema = z.object({
    id: z.string().uuid()
  })

  const { id } = getPropertiesParamsSchema.parse(request.params)

  // const property = await knex('properties').where('id', id).first()

  const leftJoin: DatabasePropertiesReturnType[] = await knex
    .select(['p.*', 'pi.*', 'pi.id as imageId', 'p.id'])
    .from('properties as p')
    .leftJoin('properties-images as pi', 'p.id', 'pi.property_id').where('p.id', id)

  const groupedData: Record<Properties['id'], Properties> = {}
  leftJoin.forEach((item) => {
    const { id, imageId, propertyId, url, ...property } = item
    const image: PropertiesImages = { url: '', order: -1, id: '' }
    const { city, street, district, postalCode, area, baths, garages, rooms, ...nonNestedValues } = property

    if (isObjectEmpty(groupedData[id])) {
      groupedData[id] = {
        ...nonNestedValues,
        id,
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
}
