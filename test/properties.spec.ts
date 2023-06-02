import { beforeAll, expect, it } from 'vitest'
import supertestRequest from 'supertest'
import { app } from '../src/app'
import { type Properties } from '../src/@types/properties'

beforeAll(async () => {
  await app.ready()
})

it('should be able to create a property', async () => {
  // interface FormData {
  //   title: string
  //   transactionType: string
  //   type: string
  //   price: number
  //   description: string
  //   rooms: number
  //   baths: number
  //   garages: number
  //   area: number
  //   street: string
  //   district: string
  //   city: string
  //   postalCode: string
  // }
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

  // console.log((await request).body)
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
    .attach('images', 'teste2.jpg')
    .attach('images', 'teste2.jpg')
    .attach('images', 'teste2.jpg')
  const response = await request
  console.log(`----------(${response.statusCode})----------`)
  console.log(response.body)
  console.log('-------------------------')
  expect(response.statusCode).toEqual(201)
})

// it('should be able to get all property', async () => {
//   const request = await supertestRequest(app.server).get('/properties')
//   expect(request.statusCode).toEqual(201)
// })
