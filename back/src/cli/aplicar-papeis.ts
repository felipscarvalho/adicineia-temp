/*
 * Aplica database/papeis.sql (usuário de banco da aplicação com privilégios mínimos, ADR-006) sem
 * depender do cliente psql. Executar como dono do esquema, depois das migrações.
 * Uso: DATABASE_URL_MIGRACAO=... SENHA_BANCO_APP=... npm run db:papeis
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { Client } from 'pg';

export const ARQUIVO_PAPEIS = path.resolve(__dirname, '..', '..', '..', 'database', 'papeis.sql');

/** Substitui a variável :senha_app do psql por um literal SQL com aspas escapadas. */
export function montarSqlPapeis(sql: string, senha: string): string {
  return sql.replace(/:senha_app\b/g, `'${senha.replace(/'/g, "''")}'`);
}

async function principal(): Promise<void> {
  const url = process.env.DATABASE_URL_MIGRACAO;
  const senha = process.env.SENHA_BANCO_APP;
  if (!url) {
    throw new Error('Defina DATABASE_URL_MIGRACAO (dono do esquema).');
  }
  if (!senha || senha.length < 12) {
    throw new Error('Defina SENHA_BANCO_APP com pelo menos 12 caracteres.');
  }
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    await cliente.query(montarSqlPapeis(await readFile(ARQUIVO_PAPEIS, 'utf8'), senha));
    console.log('Papel dataqualisus_app configurado com privilégios mínimos.');
  } finally {
    await cliente.end();
  }
}

if (require.main === module) {
  principal().catch((erro: Error) => {
    console.error(erro.message);
    process.exit(1);
  });
}
