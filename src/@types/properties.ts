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

export interface Properties {
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
}
// @ts-expect-error da erro iso awui
// eslint-disable-next-line
export interface DatabasePropertiesReturnType extends Omit<Properties, 'address' | 'details'>, Properties['address'], Properties['details'] { }

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
