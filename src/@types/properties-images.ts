export interface PropertiesImages {
  url: string
  order: number
  id: string
}

export interface PropertiesImagesDTO extends PropertiesImages {
  propertyId: string
}
