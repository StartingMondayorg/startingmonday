-- The application enforces a 200-message limit in conversation/route.ts.
-- The DB trigger added in 025 capped at 300 — a different threshold in the wrong layer.
-- Dropping both to keep business logic in the application layer only.
DO $$
BEGIN
	IF to_regclass('public.conversation_messages') IS NOT NULL THEN
		DROP TRIGGER IF EXISTS trg_trim_conversation_messages ON public.conversation_messages;
	END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_trim_conversation_messages ON public.conversations;
DROP FUNCTION IF EXISTS trim_conversation_messages();
