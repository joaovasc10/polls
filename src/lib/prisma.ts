import { PrismaClient } from "@prisma/client";

// instância do prisma para a conexão com o banco de dados
export const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], 
}); 