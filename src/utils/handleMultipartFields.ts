import { type MultipartFields } from '@fastify/multipart'

export function handleMultipartFields<T> (_fields: MultipartFields): Partial<T> {
  const fields: Partial<T> = {}

  for (const key in _fields) {
    if (Object.prototype.hasOwnProperty.call(_fields, key)) {
      const field = _fields[key]
      if ((field != null) && !Array.isArray(field) && field.type === 'field') {
        Object.assign(fields, { [field.fieldname]: field.value })
      }
    }
  }
  return fields
}
