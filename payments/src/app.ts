import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, currentUser } from "@ocgtickets/common";
import { createChargeRouter } from "./routes/new";

const app = express();
app.set("trust proxy", true); // trust nginx proxy
app.use(json());
app.use(
  cookieSession({
    signed: false, // don't encrypt, so it's language agnostic
    secure: process.env.NODE_ENV !== "test", // use https
  })
);
app.use(currentUser);

app.use(createChargeRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
