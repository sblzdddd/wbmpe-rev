export interface Banner {
  title: string
  image: string
  link: string
  external: boolean
}

export interface CardRecom {
  title: string
  image: string
  link: string
}

export interface RecomItem {
  title: string
  artist: string
  image: string
  link: string
}

export interface Recom {
  title: string
  items: RecomItem[]
}

export interface HomeData {
  banner: Banner[]
  card_recom: CardRecom[]
  recom: Recom[]
}

export interface HomeResponse {
  data: HomeData
} 