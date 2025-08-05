import { z } from 'zod'

export const searchSongSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  page: z.coerce.number().min(1, 'Page must be at least 1'),
})
