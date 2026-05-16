-- Migracao 008: permite o status cancelado em pedidos

DO $$
DECLARE
	constraint_name text;
BEGIN
	SELECT con.conname
	INTO constraint_name
	FROM pg_constraint con
	JOIN pg_class rel ON rel.oid = con.conrelid
	WHERE rel.relname = 'pedidos'
		AND con.contype = 'c'
		AND pg_get_constraintdef(con.oid) ILIKE '%status IN (%';

	IF constraint_name IS NOT NULL THEN
		EXECUTE format('ALTER TABLE pedidos DROP CONSTRAINT %I', constraint_name);
	END IF;
END $$;

ALTER TABLE pedidos
	ADD CONSTRAINT chk_pedidos_status CHECK (status IN ('novo', 'em_producao', 'entregue', 'cancelado'));