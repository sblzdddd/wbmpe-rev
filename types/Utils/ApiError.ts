export interface ApiError {
  data?: {
    statusCode: number
    message?: string
  }
}