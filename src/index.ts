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
import { __PROD__ } from "./configuration/constants";
import { AppDataSource } from "./dataSource";
import { UserDataResolver } from "./resolvers/userData";

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const server = fastify({ logger: true });

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
      });

      sendResult(result, res.raw);
    },
  });

  server.listen({ port: parseInt(process.env.PORT), host: "0.0.0.0" }, () => {
    console.log(`server is running on ${process.env.PORT}`);
  });
}

main().catch((err) => console.error(err));
