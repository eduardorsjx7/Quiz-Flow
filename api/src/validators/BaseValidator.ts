import { IValidator, ValidationResult, ValidationError } from '../interfaces/validator.interface';

/**
 * Classe base para validadores
 * Implementa o padrão Strategy Pattern para validação
 */
export abstract class BaseValidator<T> implements IValidator<T> {
  protected errors: ValidationError[] = [];

  abstract validate(data: T): Promise<ValidationResult>;

  protected addError(field: string, message: string, code?: string): void {
    this.errors.push({ field, message, code });
  }

  protected clearErrors(): void {
    this.errors = [];
  }

  protected getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
    };
  }

  protected validateRequired(value: any, fieldName: string): boolean {
    if (value === undefined || value === null || value === '') {
      this.addError(fieldName, `${fieldName} é obrigatório`, 'REQUIRED');
      return false;
    }
    return true;
  }

  protected validateNumber(value: any, fieldName: string, min?: number, max?: number): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(fieldName, `${fieldName} deve ser um número`, 'INVALID_TYPE');
      return false;
    }
    if (min !== undefined && value < min) {
      this.addError(fieldName, `${fieldName} deve ser maior ou igual a ${min}`, 'MIN_VALUE');
      return false;
    }
    if (max !== undefined && value > max) {
      this.addError(fieldName, `${fieldName} deve ser menor ou igual a ${max}`, 'MAX_VALUE');
      return false;
    }
    return true;
  }

  protected validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): boolean {
    if (typeof value !== 'string') {
      this.addError(fieldName, `${fieldName} deve ser uma string`, 'INVALID_TYPE');
      return false;
    }
    if (minLength !== undefined && value.length < minLength) {
      this.addError(fieldName, `${fieldName} deve ter pelo menos ${minLength} caracteres`, 'MIN_LENGTH');
      return false;
    }
    if (maxLength !== undefined && value.length > maxLength) {
      this.addError(fieldName, `${fieldName} deve ter no máximo ${maxLength} caracteres`, 'MAX_LENGTH');
      return false;
    }
    return true;
  }

  protected validateEmail(value: any, fieldName: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.addError(fieldName, `${fieldName} deve ser um email válido`, 'INVALID_EMAIL');
      return false;
    }
    return true;
  }

  protected validateDate(value: any, fieldName: string): boolean {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.addError(fieldName, `${fieldName} deve ser uma data válida`, 'INVALID_DATE');
      return false;
    }
    return true;
  }
}

