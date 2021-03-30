import { Message } from "node-nats-streaming";
import { Listener, OrderCreatedEvent, Subjects } from "@ocgtickets/common";
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const order = Order.build({
      id: data.id,
      status: data.status,
      userId: data.userId,
      version: data.version,
      price: data.ticket.price,
    });
    await order.save();

    msg.ack();
  }
}
