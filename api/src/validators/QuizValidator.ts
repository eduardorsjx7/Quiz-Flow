import { BaseValidator } from './BaseValidator';
import { CreateQuizDTO, UpdateQuizDTO } from '../dto/quiz.dto';

/**
 * Validador para Quiz
 */
export class QuizValidator extends BaseValidator<CreateQuizDTO | UpdateQuizDTO> {
  async validate(data: CreateQuizDTO | UpdateQuizDTO): Promise<import('../interfaces/validator.interface').ValidationResult> {
    this.clearErrors();

    // Validações para criação
    if ('faseId' in data) {
      this.validateRequired(data.faseId, 'faseId');
      this.validateNumber(data.faseId, 'faseId', 1);
    }

    if ('titulo' in data && data.titulo !== undefined) {
      this.validateRequired(data.titulo, 'titulo');
      this.validateString(data.titulo, 'titulo', 3, 200);
    }

    if ('descricao' in data && data.descricao !== undefined) {
      this.validateString(data.descricao, 'descricao', 0, 1000);
    }

    if ('ordem' in data && data.ordem !== undefined) {
      this.validateNumber(data.ordem, 'ordem', 0);
    }

    if ('pontosBase' in data && data.pontosBase !== undefined) {
      this.validateNumber(data.pontosBase, 'pontosBase', 1, 10000);
    }

    if ('dataInicio' in data && data.dataInicio) {
      this.validateDate(data.dataInicio, 'dataInicio');
    }

    if ('dataFim' in data && data.dataFim) {
      this.validateDate(data.dataFim, 'dataFim');
    }

    // Validar perguntas se for criação
    if ('perguntas' in data && Array.isArray(data.perguntas)) {
      if (data.perguntas.length === 0) {
        this.addError('perguntas', 'O quiz deve ter pelo menos uma pergunta', 'MIN_QUESTIONS');
      }

      data.perguntas.forEach((pergunta, index) => {
        if (!pergunta.texto || pergunta.texto.trim().length === 0) {
          this.addError(`perguntas[${index}].texto`, 'O texto da pergunta é obrigatório', 'REQUIRED');
        }

        if (!pergunta.alternativas || pergunta.alternativas.length < 2) {
          this.addError(`perguntas[${index}].alternativas`, 'Cada pergunta deve ter pelo menos 2 alternativas', 'MIN_ALTERNATIVES');
        }

        if (pergunta.alternativas) {
          const temCorreta = pergunta.alternativas.some(alt => alt.correta === true);
          if (!temCorreta) {
            this.addError(`perguntas[${index}].alternativas`, 'Cada pergunta deve ter pelo menos uma alternativa correta', 'NO_CORRECT_ANSWER');
          }

          pergunta.alternativas.forEach((alt, altIndex) => {
            if (!alt.texto || alt.texto.trim().length === 0) {
              this.addError(`perguntas[${index}].alternativas[${altIndex}].texto`, 'O texto da alternativa é obrigatório', 'REQUIRED');
            }
          });
        }
      });
    }

    return this.getResult();
  }
}

