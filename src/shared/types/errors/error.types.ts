export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
