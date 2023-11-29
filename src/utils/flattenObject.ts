/**
 * Flatten a multidimensional object
 *
 * For example:
 *   flattenObject{ a: 1, b: { c: 2 } }
 * Returns:
 *   { a: 1, c: 2}
 */

type FlattenObject<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? FlattenObject<T[K]> : T[K];
}

export const flattenObject = <T extends Record<string, any>> (obj: T): FlattenObject<T> => {
  const flattened: Record<string, string | number> = {}

  Object.keys(obj).forEach((key) => {
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value))
    } else {
      flattened[key] = value as string | number
    }
  })

  return flattened as FlattenObject<T>
}
