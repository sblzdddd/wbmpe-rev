export type backgroundSettings = {
  opacity: number
  blur: number
  height: number
  maskOpacity?: number
}

export const BACKGROUND: {
  playlist: backgroundSettings
  playlist_edit: backgroundSettings
  fullscreen: backgroundSettings
} = {
  playlist: {
    opacity: 0.55,
    blur: 4,
    height: 40
  },
  playlist_edit: {
    opacity: 0.35,
    blur: 32,
    height: 40
  },
  fullscreen: { opacity: 0.5, blur: 20, height: 100, maskOpacity: 0.5 }
}
