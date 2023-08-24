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
import fastifySession from "@fastify/session";
import fastifyRedis from "@fastify/redis";
import cors from "@fastify/cors";
import { AppDataSource } from "./dataSource";
import { UserDataResolver } from "./resolvers/userData";

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const server = fastify({ logger: true });
  server.register(cors, {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });
  server.register(fastifyCookie);
  server.register(fastifyRedis, { url: process.env.REDIS_URL });
  server.register(fastifySession, {
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    cookieName: COOKIE_NAME,
    cookie: {
      maxAge: SESSION_TTL,
      httpOnly: true,
      sameSite: "lax", // csrf
      secure: __PROD__, // cookie only works in https
      domain: __PROD__ ? ".example.com" : undefined,
    },
  });

  const schema = await buildSchema({
    resolvers: [UserResolver, UserDataResolver],
    validate: false,
  });

  server.route({
    method: ["POST", "GET"],
    url: "/graphql",
    async handler(req, res) {
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
        contextFactory: () => ({
          session: req.session,
        }),
      });

      sendResult(result, res.raw);
    },
  });

  server.listen({ port: parseInt(process.env.PORT), host: "0.0.0.0" }, () => {
    console.log(`server is running on ${process.env.PORT}`);
  });
}

main().catch((err) => console.error(err));
