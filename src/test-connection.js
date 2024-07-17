import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (e) {
    console.error('Falha na conexão com o banco de dados:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
