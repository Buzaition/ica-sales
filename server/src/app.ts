import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
<<<<<<< HEAD
import "./types/express.js";
=======
>>>>>>> 8a2ef891c4bd9c2ca26f50b41293a99c8a3863a9
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { sessionMiddleware } from "./middleware/session.js";
import { assertSessionSecret } from "./utils/session.js";

export const app = express();
assertSessionSecret();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use("/api", router);

export default app;
