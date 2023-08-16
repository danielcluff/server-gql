import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import fastify from "fastify";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  Request,
  sendResult,
  shouldRenderGraphiQL,
} from "graphql-helix";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import { __PROD__, COOKIE_NAME, SESSION_TTL } from "./configuration/constants";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@mgcrea/fastify-session";
import { RedisStore } from "@mgcrea/fastify-session-redis-store";
import Redis from "ioredis";
import cors from "@fastify/cors";
import { AppDataSource } from "./dataSource";
import { UserDataResolver } from "./resolvers/userData";

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const server = fastify();
  server.register(cors, {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });
  server.register(fastifyCookie);
  server.register(fastifySession, {
    cookieName: COOKIE_NAME,
    store: new RedisStore({
      client: new Redis(process.env.REDIS_URL),
      ttl: SESSION_TTL,
    }),
    cookie: {
      maxAge: SESSION_TTL,
      httpOnly: true,
      sameSite: "lax", // csrf
      secure: __PROD__, // cookie only works in https
      domain: __PROD__ ? ".example.com" : undefined,
    },
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
  });

  const schema = await buildSchema({
    resolvers: [UserResolver, UserDataResolver],
    validate: false,
  });

  server.route({
    method: ["POST", "GET"],
    url: "/graphql",
    handler: async (req, res) => {
      const request: Request = {
        headers: req.headers,
        method: req.method,
        query: req.query,
        body: req.body,
      };

      // remove this on prod
      if (shouldRenderGraphiQL(request)) {
        res.header("Content-Type", "text/html");
        res.send(
          renderGraphiQL({
            endpoint: "/graphql",
          })
        );

        return;
      }

      const { operationName, query, variables } = getGraphQLParameters(request);

      const result = await processRequest({
        request,
        schema,
        operationName,
        query,
        variables,
      });
      console.log("res", res);
      sendResult(result, res.raw);
    },
  });

  server.listen({ port: parseInt(process.env.PORT), host: "0.0.0.0" }, () => {
    console.log(`server is running on ${process.env.PORT}`);
  });
}

main().catch((err) => console.error(err));
