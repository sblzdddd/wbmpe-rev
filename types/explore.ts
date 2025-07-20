import type { Recom } from "./home"

export interface ExploreData {
  categories: string[]
  items: Recom[]
}

export interface ExploreResponse {
  data: ExploreData
}
