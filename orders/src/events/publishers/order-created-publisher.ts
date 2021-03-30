import { Publisher, OrderCreatedEvent, Subjects } from "@ocgtickets/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
