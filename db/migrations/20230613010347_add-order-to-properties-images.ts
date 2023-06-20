import { type Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('properties-images', (table) => {
    table.integer('order')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('properties-images', (table) => {
    table.dropColumn('order')
  })
}
