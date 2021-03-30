import { Publisher, Subjects, TicketCreatedEvent } from "@ocgtickets/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
