import { type PropertiesImages } from './properties-images'

export enum TransactionType {
  Sale = 'sale',
  Rental = 'rental',
}

export enum PropertyType {
  Land = 'land',
  Apartment = 'apartment',
  House = 'house',
  CondominiumHouse = 'condominium house',
}

// eslint-disable-next-line
export type Properties = {
  id: string
  transactionType: `${TransactionType}`
  type: `${PropertyType}`
  price: `${number}`
  title: string
  description: string
  address: {
    street: string
    postalCode: string
    city: string
    district: string
  }
  details: {
    rooms: `${number}`
    baths: `${number}`
    garages: `${number}`
    area: `${number}`
  }
  images: PropertiesImages[]
}

export interface PropertiesDTO {
  id: string
  transactionType: TransactionType
  type: PropertyType
  price: number | undefined
  title: string
  description: string
  street: string
  postalCode: string
  city: string
  district: string
  rooms: number | undefined
  baths: number | undefined
  garages: number | undefined
  area: number | undefined
}

// @ts-expect-error da erro iso awui
// eslint-disable-next-line
export interface DatabasePropertiesReturnType extends Properties['address'], Properties['details'], Omit<Properties, 'address' | 'details'>, Omit<PropertiesImagesDTO, 'id'> {
  imageId: string
}

export interface PropertiesPostBody {
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

// const formData: DatabasePropertiesReturnType = {
//   title: 'teste casa',
//   transactionType: 'sale',
//   type: 'apartment',
//   price: '0',
//   description: 'teste',
//   street: 'rua teste',
//   district: 'bairro 1',
//   city: 'Belém',
//   postalCode: '80232-332',
//   rooms: 1,
//   baths: 1,
//   garages: 1,
//   area: 1,
//   id: 'aaa',
//   imageId: 'aaa',
//   images: []
// }
// console.log(formData)
