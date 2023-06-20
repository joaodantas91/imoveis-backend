import { beforeAll, beforeEach, expect, it } from 'vitest'
import supertestRequest from 'supertest'
import { app } from '../src/app'
import { type Properties } from '../src/@types/properties'
import { execSync } from 'node:child_process'
import { type PropertiesImages } from '../src/@types/properties-images'

beforeAll(async () => {
  await app.ready()
})

beforeEach(() => {
  execSync('npm run knex migrate:rollback --all')
  execSync('npm run knex migrate:latest')
})

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
}

it('should be able to create a property', async () => {
  const formData: Properties = {
    title: 'teste casa',
    transactionType: 'sale',
    type: 'apartment',
    price: 0,
    description: 'teste',
    address: {
      street: 'rua teste',
      district: 'bairro 1',
      city: 'Belém',
      postalCode: '80232-332'
    },
    details: {
      rooms: 1,
      baths: 1,
      garages: 1,
      area: 1
    }
  }

  const request = supertestRequest(app.server)
    .post('/properties')

  const keys = Object.keys(formData) as Array<keyof Properties>
  for (let i = 0; i < keys.length; i++) {
    const formValue = formData[keys[i]]
    // @ts-expect-error: Unreachable code error
    void request.field(keys[i], JSON.stringify(formValue), { contentType: 'application/json' })
  }
  void request
    .attach('images', 'teste2.jpg')
  const response = await request
  console.log(`----------(${response.statusCode})----------`)
  console.log(response.body)
  console.log('-------------------------')
  expect(response.statusCode).toEqual(201)
})

it.only('should be able to update a property', async () => {
  async function createProperty (): Promise<string> {
    const formData: Properties = {
      title: 'teste casa',
      transactionType: 'sale',
      type: 'apartment',
      price: 0,
      description: 'teste',
      address: {
        street: 'rua teste',
        district: 'bairro 1',
        city: 'Belém',
        postalCode: '80232-332'
      },
      details: {
        rooms: 1,
        baths: 1,
        garages: 1,
        area: 1
      }
    }

    const request = supertestRequest(app.server)
      .post('/properties')

    const keys = Object.keys(formData) as Array<keyof Properties>
    for (let i = 0; i < keys.length; i++) {
      const formValue = formData[keys[i]]
      // @ts-expect-error: Unreachable code error
      void request.field(keys[i], JSON.stringify(formValue), { contentType: 'application/json' })
    }
    void request
      .attach('images', 'teste2.jpg')
    const response = await request

    return response.body.id
  }

  async function getProperty (id: string): Promise<Properties & { images: PropertiesImages[] }> {
    return (await supertestRequest(app.server).get(`/properties/${id}`)).body
  }

  const id = await createProperty()
  if (!(id?.length > 0)) throw new Error('Property not found')

  const property = await getProperty(id)
  const formData: RecursivePartial<Properties> & {
    imagesOrder: Array<{
      order: number
      id: string
      url: string
    }>
  } = {
    title: 'teste patch',
    address: {
      street: 'rua patch'
    },
    details: {
      rooms: 10000
    },
    imagesOrder: property.images.map((item, index) => ({
      ...item,
      order: index + 1000
    }))
  }

  const request = supertestRequest(app.server)
    .patch(`/properties/${id}`)

  const keys = Object.keys(formData) as Array<keyof Properties>
  for (let i = 0; i < keys.length; i++) {
    const formValue = formData[keys[i]]
    // @ts-expect-error: Unreachable code error
    void request.field(keys[i], JSON.stringify(formValue), { contentType: 'application/json' })
  }
  void request
    .attach('images', 'teste2.jpg', { filename: '1.jpg' })
    .attach('images', 'teste2.jpg', { filename: '2.jpg' })

  const response = await request
  console.log(response.error)
  // console.log(await getProperty(id))
  expect(response.statusCode).toEqual(201)
})

it('should be able to get all property', async () => {
  const request = await supertestRequest(app.server).get('/properties')
  expect(request.statusCode).toEqual(200)
})
