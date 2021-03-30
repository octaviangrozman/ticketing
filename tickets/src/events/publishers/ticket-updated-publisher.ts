import { Publisher, Subjects, TicketUpdatedEvent } from "@ocgtickets/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
