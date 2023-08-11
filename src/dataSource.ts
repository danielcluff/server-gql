import { DataSource } from "typeorm";
import { __PROD__ } from "./configuration/constants";
import { User } from "./entities/User";
import { UserData } from "./entities/UserData";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: !__PROD__,
  logging: true,
  entities: [User, UserData],
  subscribers: [],
  migrations: [],
});
