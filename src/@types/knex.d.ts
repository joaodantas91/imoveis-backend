// eslint-disable-next-line
import { type Knex } from 'knex'
import { type PropertiesDTO } from './properties'
import { type PropertiesImagesDTO } from './properties-images'

declare module 'knex/types/tables' {
  export interface Tables {
    properties: PropertiesDTO
    ['properties-images']: PropertiesImagesDTO
  }
}
