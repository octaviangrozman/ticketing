import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from "@ocgtickets/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}
