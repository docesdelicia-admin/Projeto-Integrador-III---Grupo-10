-- Migracao 009: substitui a constraint antiga de status de pedidos

ALTER TABLE pedidos
	DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE pedidos
	DROP CONSTRAINT IF EXISTS chk_pedidos_status;

ALTER TABLE pedidos
	ADD CONSTRAINT chk_pedidos_status CHECK (status IN ('novo', 'em_producao', 'entregue', 'cancelado'));