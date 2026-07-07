import { useParams } from "react-router-dom";

import StubPage from "../components/StubPage";

export default function TicketDetail() {
  const { ticketId } = useParams();
  return (
    <StubPage
      title="Ticket Detail"
      subtitle={`GET /tickets/${ticketId ?? ":id"} — full analysis, status change, soft delete.`}
      phase="Phase 2"
    />
  );
}
