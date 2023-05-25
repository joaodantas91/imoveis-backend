import { type Knex } from 'knex'
import { PropertyType, TransactionType } from '../../src/@types/properties'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('properties', (table) => {
    table.text('description')
    table.enum('transactionType', Object.values(TransactionType))
    table.enum('type', Object.values(PropertyType))
    table.integer('price')
    table.text('street')
    table.text('city')
    table.text('postalCode')
    table.text('district')
    table.integer('rooms')
    table.integer('baths')
    table.integer('garages')
    table.integer('area')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('properties', (table) => {
    table.dropColumns(
      'description',
      'transactionType',
      'type',
      'price',
      'street',
      'city',
      'postalCode',
      'district',
      'rooms',
      'baths',
      'garages',
      'area'
    )
  })
}
