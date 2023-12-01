import { type FastifyRequest, type FastifyReply } from 'fastify'
import { type DatabasePropertiesReturnType, type Properties } from '../../@types/properties'
import { type PropertiesImages } from '../../@types/properties-images'
import { knex } from '../../database'
import { isObjectEmpty } from '../../utils/isObjectEmpty'

export async function getProperties (_: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const leftJoin: DatabasePropertiesReturnType[] = await knex
    .select(['p.*', 'pi.*', 'pi.id as imageId', 'p.id'])
    .from('properties as p')
    .leftJoin('properties-images as pi', 'p.id', 'pi.property_id').groupBy('p.id')

  const groupedData: Record<Properties['id'], Properties> = {} // Array<>
  console.log(leftJoin)
  // leftJoin.forEach((item) => {
  //   const { id, property_id: _, imageId, url, ...property } = item
  //   const image: PropertiesImages = { url: '', order: -1, id: '' }
  //   const { city, street, district, postalCode, area, baths, garages, rooms, ...nonNestedValues } = property

  //   if (isObjectEmpty(groupedData[id])) {
  //     groupedData[id] = {
  //       ...nonNestedValues,
  //       id,
  //       address: {
  //         city, street, district, postalCode
  //       },
  //       details: {
  //         area, baths, garages, rooms
  //       },
  //       images: []
  //     }
  //   }

  //   if ((url != null) && url.length > 0) {
  //     image.id = imageId
  //     image.url = item.url
  //     image.order = item.order
  //     groupedData[id].images.push(image)
  //   }
  // })

  return await reply.status(200).send(Object.values(groupedData))
}
