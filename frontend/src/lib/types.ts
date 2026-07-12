export interface ApiError {
  status: number;
  error: string;
  message: string;
  errors: string[];
}
