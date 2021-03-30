import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { OrderStatus } from "@ocgtickets/common";

interface OrderAttrs {
  // we want to specify manually id because payments service
  // is not the primary service to own Orders entity
  // it just replicates it in its own db
  // thus we must have consistent order records with the same ids
  // as in orders (primary) service
  id: string;
  version: number;
  status: OrderStatus;
  userId: string;
  price: number;
}

export interface OrderDoc extends mongoose.Document {
  status: OrderStatus;
  userId: string;
  price: number;
  version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
  // find by id and previous version
  findByEvent(event: { id: string; version: number }): Promise<OrderDoc | null>;
}

const orderSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    userId: {
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

orderSchema.set("versionKey", "version");
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order({
    // we have to explicitly map it because mongoose
    // uses _id instead of id
    _id: attrs.id,
    version: attrs.version,
    status: attrs.status,
    userId: attrs.userId,
    price: attrs.price,
  });
};
orderSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Order.findOne({
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

const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);

export { Order };
