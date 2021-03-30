import { Message } from "node-nats-streaming";
import { Listener, OrderCreatedEvent, Subjects } from "@ocgtickets/common";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    // find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // if no ticket, throw error
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // WHAT DO WE DO in case there is already an orderId defined by another order?
    // should we fail early so that we don't override?
    // answer: it is already checked in orders-service with
    // ticket.isReserved() before creating a new order in new.ts route handler

    // mark ticket as reserved by setting its orderId property
    ticket.set({ orderId: data.id });

    // save ticket
    await ticket.save();

    // publish event that ticket has been updated
    new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      userId: ticket.userId,
      version: ticket.version,
      orderId: ticket.orderId,
    });

    // ack message
    msg.ack();
  }
}
