/**
 * Interface base para repositórios
 * Implementa o padrão Repository Pattern
 */
export interface IRepository<T, ID = number> {
  findById(id: ID): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

/**
 * Interface para repositórios com operações customizadas
 */
export interface IExtendedRepository<T, ID = number> extends IRepository<T, ID> {
  findMany(where: any, include?: any, orderBy?: any): Promise<T[]>;
  findFirst(where: any, include?: any): Promise<T | null>;
  count(where?: any): Promise<number>;
}

