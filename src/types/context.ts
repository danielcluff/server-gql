import { Session, SessionData } from "@mgcrea/fastify-session";
import { FastifyRequest, FastifyReply } from "fastify";
import { Redis } from "ioredis";

export type MyContext = {
  req: FastifyRequest & {
    session: Session & Partial<SessionData> & { userId: string };
  };
  redis: Redis;
  res: FastifyReply;
};
