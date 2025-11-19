import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';
import config from '../config/env';

const prisma = new PrismaClient();

async function main() {
  logger.info('Inicializando banco de dados...');

  // Verificar se já existe um admin
  const adminExists = await prisma.usuario.findFirst({
    where: { tipo: 'ADMINISTRADOR' },
  });

  if (!adminExists) {
    const senhaHash = await bcrypt.hash('admin123', 10);

    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@quizflow.com',
        senha: senhaHash,
        tipo: 'ADMINISTRADOR',
      },
    });

    logger.info('Administrador padrão criado', {
      email: 'admin@quizflow.com',
      senha: 'admin123',
    });
  } else {
    logger.info('Administrador já existe no banco de dados');
  }
}

main()
  .catch((e) => {
    logger.error('Erro ao inicializar banco de dados', { error: e });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
