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
    rooms: number | undefined
    baths: number | undefined
    garages: number | undefined
    area: number | undefined
  }
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
