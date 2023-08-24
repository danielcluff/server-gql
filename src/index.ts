import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  sendResult,
  shouldRenderGraphiQL,
} from "graphql-helix";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import { __PROD__, COOKIE_NAME } from "./configuration/constants";
import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import cors from "cors";
import { AppDataSource } from "./dataSource";
import { UserDataResolver } from "./resolvers/userData";

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const server = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  server.set("proxy", 1);
  server.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  server.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __PROD__, // cookie only works in https
        domain: __PROD__ ? ".codeponder.com" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const schema = await buildSchema({
    resolvers: [UserResolver, UserDataResolver],
    validate: false,
  });

  server.use("/graphql", async (req, res) => {
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    };

    if (shouldRenderGraphiQL(request)) {
      res.send(renderGraphiQL());
    } else {
      const { operationName, query, variables } = getGraphQLParameters(request);

      const result = await processRequest({
        operationName,
        query,
        variables,
        request,
        schema,
        contextFactory: () => ({
          session: req.session,
        }),
      });

      sendResult(result, res);
    }
  });

  server.listen({ port: parseInt(process.env.PORT), host: "0.0.0.0" }, () => {
    console.log(`server is running on ${process.env.PORT}`);
  });
}

main().catch((err) => console.error(err));
