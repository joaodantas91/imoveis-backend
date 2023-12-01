import path from 'path'
import { env } from '../env'

export function getFileURL (filename: string): string {
  if (env.NODE_ENV === 'test') {
    return path.resolve(__dirname, `../../db/images-test/${filename}`)
  }
  return path.resolve(__dirname, `../../db/images/${filename}`)
}
