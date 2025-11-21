/**
 * Interface para validadores
 * Implementa o padrão Strategy Pattern para validação
 */
export interface IValidator<T> {
  validate(data: T): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Interface para regras de validação específicas
 */
export interface IValidationRule<T> {
  validate(value: T, context?: any): Promise<boolean>;
  getErrorMessage(field: string): string;
}

