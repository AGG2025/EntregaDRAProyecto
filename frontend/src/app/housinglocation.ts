export interface HousingLocationInfo {
  id: number;
  name: string;
  city: string;
  state: string;
  photo: string;
  availableUnits: number;
  wifi: boolean;
  laundry: boolean;
}

// New interface matching the structure of almeria_pisos.json
export interface Listing {
  id: number; // generated index
  titulo: string;
  precio: string;
  detalles: string;
  descripcion_corta: string;
  url: string;
  // parsed numeric fields for filtering
  bedrooms?: number;
  areaM2?: number;
  // extracted information
  discounted?: boolean;
}
