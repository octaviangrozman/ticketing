import { Publisher, OrderCancelledEvent, Subjects } from "@ocgtickets/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
