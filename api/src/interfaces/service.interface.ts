/**
 * Interface base para serviços
 * Implementa o padrão Service Layer
 */
export interface IService<T, CreateDTO, UpdateDTO> {
  create(data: CreateDTO): Promise<T>;
  update(id: number, data: UpdateDTO): Promise<T>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<T>;
  findAll(filters?: any): Promise<T[]>;
}

/**
 * Interface para resposta padronizada da API
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

