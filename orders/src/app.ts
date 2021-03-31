import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, currentUser } from "@ocgtickets/common";

import { newOrderRouter } from "./routes/new";
import { showOrderRouter } from "./routes/show";
import { indexOrderRouter } from "./routes/index";
import { deleteOrderRouter } from "./routes/delete";

const app = express();
app.set("trust proxy", true); // trust nginx proxy
app.use(json());
app.use(
  cookieSession({
    signed: false, // don't encrypt, so it's language agnostic
    // secure: process.env.NODE_ENV !== "test", // use https
    secure: false,
  })
);
app.use(currentUser);

app.use(newOrderRouter);
app.use(showOrderRouter);
app.use(indexOrderRouter);
app.use(deleteOrderRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
