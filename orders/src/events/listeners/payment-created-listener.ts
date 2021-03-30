import { Message } from "node-nats-streaming";
import {
  Listener,
  Subjects,
  PaymentCreatedEvent,
  OrderStatus,
} from "@ocgtickets/common";
import { Order } from "../../models/order";
import { queueGroupName } from "./queue-group-name";

// TODO: write a unti test for PaymentCreatedListener
export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent["data"], msg: Message) {
    const { id, orderId, stripeId } = data;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found!");
    }

    order.set({
      status: OrderStatus.Complete,
    });
    await order.save();

    msg.ack();
  }
}
