import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { OrderStatus } from "@ocgtickets/common";
import { Order } from "./order";

interface TicketAttrs {
  // we want to specify manually id because orders service
  // is not the primary service to own Tickets entity
  // it just replicates it in its own db
  // thus we must have consistent ticket records with the same ids
  // as in tickets (primary) service
  id: string;
  title: string;
  price: number;
}

export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number;
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  // find by id and previous version
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

ticketSchema.set("versionKey", "version");
ticketSchema.plugin(updateIfCurrentPlugin);

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    // we have to explicitly map it because mongoose
    // uses _id instead of id
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
  });
};
ticketSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Ticket.findOne({
    _id: event.id,
    // this solves concurrency issues
    // we try to find the record in db with this id and version -1
    // version - 1 ensures that we process events in the correct order
    // e.g. if current version == 0 and we receive an event with version == 1
    // then it's fine, because it's the next incremented version we must process
    // BUT if we receive event with version == 2, it means that we got
    // an event which probably was delievered faster/OUT of order
    // and skipped the previous event. in this case we will throw an error
    // because we didn't find the record in DB with this id and version
    // therefore the event will not be acknolwledged and NATS will
    // need to resend this event again to one of the running instances
    // which will hopefully be delievered after the previous event
    // and will be processed correctly
    version: event.version - 1,
  });
};
ticketSchema.methods.isReserved = async function () {
  // this === the ticket document that we just called 'isReserved' on

  // Run query to look at all orders. Find order where ticket
  // is the ticket we just found AND the orders status is NOT cancelled
  // if we find an order from that means the ticket IS reserved
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder;
};

const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
