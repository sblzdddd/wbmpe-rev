export type backgroundSettings = {
  opacity: number
  lightOpacity?: number
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
    opacity: 0.35,
    blur: 0,
    height: 50
  },
  playlist_edit: {
    opacity: 0.3,
    blur: 32,
    height: 90
  },
  fullscreen: { opacity: 0.5, lightOpacity: 0.8, blur: 12, height: 100, maskOpacity: 0.5 }
}
