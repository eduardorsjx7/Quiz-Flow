import { container } from './ServiceContainer';
import { QuizRepository } from '../repositories/QuizRepository';
import { FaseRepository } from '../repositories/FaseRepository';
import { QuizService } from '../services/v1/QuizService';
import { FaseService } from '../services/v1/FaseService';
import { QuizController } from '../controllers/v1/QuizController';
import { FaseController } from '../controllers/v1/FaseController';

/**
 * Registra todos os serviços no container de Dependency Injection
 * Implementa o padrão Dependency Injection
 */
export function registerServices() {
  // Repositórios
  container.registerSingleton('QuizRepository', new QuizRepository());
  container.registerSingleton('FaseRepository', new FaseRepository());

  // Serviços
  container.register('QuizService', () => {
    const quizRepository = container.resolve<QuizRepository>('QuizRepository');
    return new QuizService(quizRepository);
  });

  container.register('FaseService', () => {
    const faseRepository = container.resolve<FaseRepository>('FaseRepository');
    return new FaseService(faseRepository);
  });

  // Controllers
  container.register('QuizController', () => {
    const quizService = container.resolve<QuizService>('QuizService');
    return new QuizController(quizService);
  });

  container.register('FaseController', () => {
    const faseService = container.resolve<FaseService>('FaseService');
    return new FaseController(faseService);
  });
}

