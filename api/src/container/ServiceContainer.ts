/**
 * Container de Dependency Injection
 * Implementa o padrão Dependency Injection / Service Locator
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Registra um serviço no container
   */
  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  /**
   * Registra uma instância singleton
   */
  registerSingleton<T>(name: string, instance: T): void {
    this.services.set(name, () => instance);
  }

  /**
   * Resolve um serviço do container
   */
  resolve<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found in container`);
    }
    return factory() as T;
  }

  /**
   * Verifica se um serviço está registrado
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Remove um serviço do container
   */
  unregister(name: string): void {
    this.services.delete(name);
  }

  /**
   * Limpa todos os serviços
   */
  clear(): void {
    this.services.clear();
  }
}

// Exportar instância singleton
export const container = ServiceContainer.getInstance();

