import { z } from 'zod'
import { PropertyType, TransactionType } from '../@types/properties'

export const addressSchema = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  district: z.string()
})

export const detailsSchema = z.object({
  rooms: z.coerce.number(z.number().optional()),
  baths: z.coerce.number(z.number().optional()),
  garages: z.coerce.number(z.number().optional()),
  area: z.coerce.number(z.number().optional())
})

export const PropertyBodySchema = z.object({
  title: z.string(),
  transactionType: z.nativeEnum(TransactionType),
  type: z.nativeEnum(PropertyType),
  price: z.coerce.number(z.number().optional()),
  description: z.string(),
  address: addressSchema,
  details: detailsSchema
})
