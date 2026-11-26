-- The Live Payment Feed shows how each payment was matched (§8.6 item 4).
alter table payments add column match_kind text check (match_kind in ('Auto', 'Guardian phone', 'Learned', 'Reviewed', 'Manual', '—'));
-- Ledger lines that settle a fee line point at it, so balances can be rebuilt from the ledger alone.
create index on ledger_entries (source_id);
