-- Add index for event-scoped ticket list ordering (getTickets orders by createdAt desc)
CREATE INDEX IF NOT EXISTS "Ticket_eventId_createdAt_idx" ON "Ticket"("eventId", "createdAt");
