import type { z } from "zod"
import type { H3Event } from "h3"

export async function parseRouteParams<T extends z.ZodTypeAny>(
  event: H3Event,
  schema: T
): Promise<z.infer<T>> {
  const raw = Object.fromEntries(Object.entries(event.context.params || {}))
  const result = await schema.safeParseAsync(raw)
  console.log(result.error?.issues)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Parameters validation error",
      message: result.error.issues.map((issue) => issue.message).join('; '),
      data: result.error.issues
    })
  }
  return result.data
}
