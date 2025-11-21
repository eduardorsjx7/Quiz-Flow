import { PrismaClient } from '@prisma/client';
import { IExtendedRepository } from '../interfaces/repository.interface';
import logger from '../config/logger';

/**
 * Classe base para repositórios
 * Implementa o padrão Repository Pattern com Prisma
 */
export abstract class BaseRepository<T, ID = number> implements IExtendedRepository<T, ID> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  async findById(id: ID): Promise<T | null> {
    try {
      const result = await (this.prisma as any)[this.modelName].findUnique({
        where: { id },
      });
      return result;
    } catch (error) {
      logger.error(`Error finding ${this.modelName} by id`, { error, id });
      throw error;
    }
  }

  async findAll(filters?: any): Promise<T[]> {
    try {
      const result = await (this.prisma as any)[this.modelName].findMany({
        where: filters || {},
      });
      return result;
    } catch (error) {
      logger.error(`Error finding all ${this.modelName}`, { error });
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const result = await (this.prisma as any)[this.modelName].create({
        data,
      });
      logger.info(`${this.modelName} created`, { id: (result as any).id });
      return result;
    } catch (error) {
      logger.error(`Error creating ${this.modelName}`, { error });
      throw error;
    }
  }

  async update(id: ID, data: Partial<T>): Promise<T> {
    try {
      const result = await (this.prisma as any)[this.modelName].update({
        where: { id },
        data,
      });
      logger.info(`${this.modelName} updated`, { id });
      return result;
    } catch (error) {
      logger.error(`Error updating ${this.modelName}`, { error, id });
      throw error;
    }
  }

  async delete(id: ID): Promise<void> {
    try {
      await (this.prisma as any)[this.modelName].delete({
        where: { id },
      });
      logger.info(`${this.modelName} deleted`, { id });
    } catch (error) {
      logger.error(`Error deleting ${this.modelName}`, { error, id });
      throw error;
    }
  }

  async exists(id: ID): Promise<boolean> {
    try {
      const count = await (this.prisma as any)[this.modelName].count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      logger.error(`Error checking existence of ${this.modelName}`, { error, id });
      return false;
    }
  }

  async findMany(where: any, include?: any, orderBy?: any): Promise<T[]> {
    try {
      const result = await (this.prisma as any)[this.modelName].findMany({
        where,
        include,
        orderBy,
      });
      return result;
    } catch (error) {
      logger.error(`Error finding many ${this.modelName}`, { error });
      throw error;
    }
  }

  async findFirst(where: any, include?: any): Promise<T | null> {
    try {
      const result = await (this.prisma as any)[this.modelName].findFirst({
        where,
        include,
      });
      return result;
    } catch (error) {
      logger.error(`Error finding first ${this.modelName}`, { error });
      throw error;
    }
  }

  async count(where?: any): Promise<number> {
    try {
      const result = await (this.prisma as any)[this.modelName].count({
        where: where || {},
      });
      return result;
    } catch (error) {
      logger.error(`Error counting ${this.modelName}`, { error });
      throw error;
    }
  }
}

