export type backgroundSettings = {
  opacity: number
  blur: number
  height: number
}

export const BACKGROUND: {
  playlist: backgroundSettings
  playlist_edit: backgroundSettings
} = {
  playlist: {
    opacity: 0.55,
    blur: 0,
    height: 40
  },
  playlist_edit: {
    opacity: 0.35,
    blur: 32,
    height: 40
  }
}
