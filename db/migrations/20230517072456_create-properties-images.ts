import { type Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('properties-images', function (table) {
    table.uuid('id').primary()
    table.uuid('property_id').notNullable()
    table.foreign('property_id').references('properties.id')
    table.string('url').notNullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('properties-images')
}
