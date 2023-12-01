export function isObjectEmpty (obj: Record<string, unknown>): boolean {
  for (const prop in obj) {
    if (Object.hasOwnProperty.call(obj, prop)) {
      return false
    }
  }
  return true
}
