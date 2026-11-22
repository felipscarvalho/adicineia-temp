import { readFileSync } from 'fs';
import { ARQUIVO_PAPEIS, montarSqlPapeis } from './aplicar-papeis';

describe('montarSqlPapeis', () => {
  it('substitui a senha do papel por literal com aspas escapadas', () => {
    const sql = montarSqlPapeis(readFileSync(ARQUIVO_PAPEIS, 'utf8'), "abc'; DROP ROLE x; --");
    expect(sql).toContain("ALTER ROLE dataqualisus_app PASSWORD 'abc''; DROP ROLE x; --';");
    expect(sql).not.toContain(':senha_app');
  });
});
