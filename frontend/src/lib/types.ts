export interface UserSummary {
  id: string;
  username: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  errors: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}
