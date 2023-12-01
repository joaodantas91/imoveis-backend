import { type FastifyRequest, type FastifyReply } from 'fastify'
import path from 'path'
import { PropertyBodySchema } from '../../schemas/properties'
import { handleMultipartFields } from '../../utils/handleMultipartFields'
import { type UUID, randomUUID } from 'crypto'
import { knex } from '../../database'
import { getFileURL } from '../../utils/getFileURL'
import { flattenObject } from '../../utils/flattenObject'
import fs from 'fs'

interface Image {
  url: string
  id: UUID
  property_id: UUID
}

export async function createProperty (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  // const safeNumberSchema = z.string().regex(/^\d+$/).transform(Number)
  const _files = await request.saveRequestFiles({ tmpdir: path.resolve(__dirname, '../../../db/temp') })

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
}
