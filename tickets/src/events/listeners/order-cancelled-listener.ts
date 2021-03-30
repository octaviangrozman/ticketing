import { Message } from "node-nats-streaming";
import { Listener, OrderCancelledEvent, Subjects } from "@ocgtickets/common";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    // find the ticket that the order is reserved
    const ticket = await Ticket.findById(data.ticket.id);

    // if no ticket, throw error
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (!ticket.orderId) {
      throw new Error("Ticket is not reserved");
    }

    // mark ticket as cancelled by resetting its orderId to undefined
    ticket.set({ orderId: undefined });

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
