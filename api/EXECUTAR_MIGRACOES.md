# Executar Migrações Manualmente

Como o Prisma está apresentando problemas com a leitura do arquivo .env, você pode executar as migrações SQL diretamente no banco de dados.

## Opção 1: Via Docker (Recomendado)

```bash
# Executar o SQL dentro do container do PostgreSQL
docker exec -i quiz-flow-postgres psql -U quizuser -d quizflow < api/prisma/migrate-all.sql
```

## Opção 2: Via psql localmente

Se você tem o psql instalado localmente e o banco está acessível:

```bash
psql -h localhost -U quizuser -d quizflow -f api/prisma/migrate-all.sql
```

Senha: `quizpassword`

## Opção 3: Via Prisma Studio (Interface Gráfica)

```bash
cd api
npx prisma studio
```

Depois, vá em "Raw SQL" e execute o conteúdo do arquivo `migrate-all.sql`.

## Verificar se as migrações foram aplicadas

Execute este SQL para verificar:

```sql
-- Verificar colunas da tabela jornadas
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'jornadas' 
    AND column_name IN ('imagemCapa', 'mostrarQuestaoCerta', 'mostrarTaxaErro', 'mostrarPodio', 'mostrarRanking', 'permitirTentativasIlimitadas', 'tempoLimitePorQuestao')
ORDER BY column_name;

-- Verificar colunas da tabela fases
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'fases' 
    AND column_name IN ('dataDesbloqueio', 'pontuacao')
ORDER BY column_name;
```

## Nota sobre o erro do Prisma

O erro `Expected a string value, but received literal value DATABASE_URL` parece ser um bug conhecido do Prisma 5.7.1 em alguns ambientes Windows. 

**Solução temporária**: Execute as migrações SQL manualmente como descrito acima.

**Solução permanente**: Considere atualizar o Prisma para uma versão mais recente ou usar Docker para executar os comandos do Prisma.

