import { PaymentCreatedEvent, Publisher, Subjects } from "@ocgtickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
