import { z } from "zod"

/**
 * Validates data using a given Zod schema and maps errors into a key-value object.
 * Returns { data, errors } where:
 *  - data = parsed data if valid
 *  - errors = object with field-specific errors if invalid
 */
export function validateForm<T>(
  schema: z.ZodType<T>,
  data: unknown
): { data: T | null; errors: Partial<Record<keyof T, string>> } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.issues.reduce((acc, issue) => {
      const field = issue.path[0] as keyof T
      acc[field] = issue.message
      return acc
    }, {} as Partial<Record<keyof T, string>>)

    return { data: null, errors }
  }

  return { data: result.data, errors: {} }
}
