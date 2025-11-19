# Quiz Flow - Sistema de Quiz Corporativo

Sistema completo de quiz avaliativo corporativo inspirado no Kahoot!, desenvolvido com Docker, Node.js, React, TypeScript e PostgreSQL.

## 🎯 Funcionalidades

### Painel do Administrador
- ✅ Cadastro, edição e exclusão de quizzes
- ✅ Cadastro de perguntas com múltiplas alternativas
- ✅ Definição de tempo por questão (15, 30, 60 segundos, etc.)
- ✅ Sistema de pontuação com bônus por velocidade
- ✅ Geração de códigos de acesso para sessões
- ✅ Dashboard com estatísticas
- ✅ Relatórios detalhados (por quiz, colaborador e questão)
- ✅ Exportação de relatórios em CSV e PDF

### Área do Participante
- ✅ Tela de entrada com código da sessão
- ✅ Visualização de perguntas uma por vez
- ✅ Contagem regressiva visível
- ✅ Feedback imediato após cada resposta
- ✅ Ranking atualizado em tempo real
- ✅ Tela de resumo final com estatísticas completas

### Sistema de Pontuação
- ✅ Pontos base por acerto
- ✅ Bônus proporcional à rapidez da resposta
- ✅ Ranking em tempo real via WebSockets
- ✅ Desempate por menor tempo total

## 🛠️ Stack Tecnológica

- **Web**: React 18 + TypeScript + Material-UI
- **API**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL 15
- **ORM**: Prisma
- **WebSockets**: Socket.io
- **Logging**: Winston com rotação diária de arquivos
- **Containerização**: Docker + Docker Compose

## 📁 Estrutura do Projeto

```
api/                    # Backend API
├── src/
│   ├── config/          # Configurações (logger, database, env)
│   ├── controllers/     # Controllers (lógica de requisições HTTP)
│   ├── services/        # Services (lógica de negócio)
│   ├── routes/          # Rotas da API
│   ├── middleware/      # Middlewares (auth, logger, errorHandler)
│   ├── utils/          # Utilitários
│   ├── scripts/        # Scripts de inicialização
│   ├── app.ts         # Configuração do Express
│   └── server.ts      # Servidor HTTP e Socket.io
├── prisma/
│   └── schema.prisma  # Schema do banco de dados
└── logs/              # Arquivos de log (gerados automaticamente)

web/                    # Frontend Web Application
├── src/
│   ├── pages/         # Páginas da aplicação
│   ├── components/    # Componentes reutilizáveis
│   ├── contexts/      # Contextos React
│   ├── services/      # Serviços (API)
│   └── utils/         # Utilitários
```

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Git (opcional)

## 🚀 Como Executar

### 1. Clone o repositório (se aplicável)
```bash
git clone <url-do-repositorio>
cd Quiz-Flow
```

### 2. Inicie os containers

Na raiz do projeto:

**Modo com logs (recomendado para desenvolvimento):**
```bash
docker-compose up --build
```

**Modo sem logs (background/detached):**
```bash
docker-compose up -d --build
```

Este comando irá:
- Criar e iniciar o container do PostgreSQL
- Criar e iniciar o container da API
- Criar e iniciar o container do Web
- Executar as migrations do Prisma automaticamente
- Criar um administrador padrão

**Comandos úteis:**
- Ver logs: `docker-compose logs` ou `docker-compose logs -f` (seguir logs)
- Ver logs de um serviço específico: `docker-compose logs api` ou `docker-compose logs web`
- Parar containers: `docker-compose down`
- Parar e remover volumes: `docker-compose down -v`

### 3. Acesse a aplicação

- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **PostgreSQL**: localhost:5432

## 👤 Credenciais Padrão

Após a inicialização, um administrador padrão é criado automaticamente:

- **Email**: admin@quizflow.com
- **Senha**: admin123

**IMPORTANTE**: Altere essas credenciais após o primeiro acesso!

## 📊 Sistema de Logs

O sistema utiliza Winston para logging profissional com:

- **Logs por nível**: error, warn, info, debug
- **Rotação diária**: Arquivos são rotacionados diariamente
- **Arquivos separados**:
  - `error-YYYY-MM-DD.log`: Apenas erros
  - `combined-YYYY-MM-DD.log`: Todos os logs
  - `http-YYYY-MM-DD.log`: Logs de requisições HTTP
  - `exceptions-YYYY-MM-DD.log`: Exceções não capturadas
  - `rejections-YYYY-MM-DD.log`: Promises rejeitadas
- **Retenção**: 14 dias para erros, 7 dias para HTTP
- **Compressão**: Arquivos antigos são comprimidos automaticamente

Os logs são salvos em `backend/logs/` e também exibidos no console em desenvolvimento.

## 🏗️ Arquitetura

### Backend

A aplicação segue uma arquitetura em camadas:

1. **Routes**: Definem os endpoints da API
2. **Controllers**: Processam requisições HTTP e chamam services
3. **Services**: Contêm a lógica de negócio
4. **Models**: Prisma Client (gerado automaticamente)

### Padrões Implementados

- **Separação de responsabilidades**: Cada camada tem uma responsabilidade específica
- **Error handling centralizado**: Todos os erros são tratados de forma consistente
- **Logging estruturado**: Logs incluem contexto e metadados
- **Validação de entrada**: Validações nas camadas apropriadas
- **Async/await**: Uso consistente de async/await com tratamento de erros

## 🔐 Segurança

- JWT para autenticação
- Rate limiting em endpoints públicos
- Validação de entrada de dados
- Proteção contra SQL Injection (Prisma)
- CORS configurado
- Senhas hasheadas com bcrypt

## 📝 Variáveis de Ambiente

### API

Crie um arquivo `.env` na pasta `api`:

```env
DATABASE_URL="postgresql://quizuser:quizpassword@postgres:5432/quizflow"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
JWT_EXPIRES_IN=24h
```

### Web (Frontend)

As variáveis são configuradas no `docker-compose.yml`:

```yaml
REACT_APP_API_URL: http://localhost:3001
REACT_APP_WS_URL: ws://localhost:3001
```

## 🧪 Desenvolvimento

### Executar migrations do Prisma

```bash
docker-compose exec api npm run prisma:migrate
```

### Acessar Prisma Studio

```bash
docker-compose exec api npm run prisma:studio
```

### Ver logs

```bash
# Logs da API
docker-compose logs -f api

# Logs do Web
docker-compose logs -f web

# Logs do PostgreSQL
docker-compose logs -f postgres

# Todos os logs
docker-compose logs -f
```

### Executar script de inicialização

```bash
docker-compose exec api npm run init-db
```

## 📖 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/criar-admin` - Criar administrador
- `GET /api/auth/me` - Obter usuário atual

### Quizzes
- `GET /api/quizzes` - Listar quizzes
- `GET /api/quizzes/:id` - Buscar quiz por ID
- `GET /api/quizzes/codigo/:codigo` - Buscar quiz por código
- `POST /api/quizzes` - Criar quiz (admin)
- `PUT /api/quizzes/:id` - Atualizar quiz (admin)
- `DELETE /api/quizzes/:id` - Deletar quiz (admin)

### Sessões
- `POST /api/sessoes` - Criar sessão (admin)
- `GET /api/sessoes/codigo/:codigo` - Buscar sessão por código
- `POST /api/sessoes/:codigo/entrar` - Entrar na sessão
- `POST /api/sessoes/:id/iniciar` - Iniciar sessão (admin)
- `POST /api/sessoes/:id/finalizar` - Finalizar sessão (admin)
- `GET /api/sessoes/:codigo/ranking` - Obter ranking

### Respostas
- `POST /api/respostas` - Processar resposta
- `GET /api/respostas/participante/:id` - Buscar respostas do participante

### Relatórios
- `GET /api/relatorios/quiz/:quizId` - Relatório por quiz (admin)
- `GET /api/relatorios/colaborador/:usuarioId` - Relatório por colaborador (admin)
- `GET /api/relatorios/pergunta/:perguntaId` - Relatório por pergunta (admin)
- `GET /api/relatorios/quiz/:quizId/export/csv` - Exportar CSV (admin)
- `GET /api/relatorios/quiz/:quizId/export/pdf` - Exportar PDF (admin)

## 🐛 Troubleshooting

### Erro de conexão com o banco
- Verifique se o PostgreSQL está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs postgres`

### Erro ao executar migrations
- Certifique-se de que o PostgreSQL está saudável antes da API iniciar
- Execute manualmente: `docker-compose exec api npm run prisma:migrate`

### Porta já em uso
- Altere as portas no `docker-compose.yml` se necessário

### Logs não aparecem
- Verifique se a pasta `api/logs` existe e tem permissões de escrita
- Verifique a variável `LOG_LEVEL` no `.env` da API
- Os logs também aparecem no console em modo desenvolvimento

## 📄 Licença

Este projeto é um exemplo educacional e pode ser usado livremente.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
