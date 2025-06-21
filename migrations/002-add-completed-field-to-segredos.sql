-- up
-- Adiciona uma nova coluna 'concluido' na tabela 'segredos'.
-- O tipo é BOOLEAN (verdadeiro/falso) e o valor padrão é FALSE.
ALTER TABLE segredos ADD COLUMN concluido BOOLEAN DEFAULT FALSE;

-- down
-- Reverter esta migração é mais complexo no SQLite, pois ele não suporta
-- "DROP COLUMN" de forma simples. O processo correto envolve recriar a tabela.
-- Manteremos simples por agora, mas em um sistema de produção,
-- o 'down' para esta operação seria mais elaborado.
-- Por ora, esta migration não terá uma ação 'down' efetiva para simplificar.