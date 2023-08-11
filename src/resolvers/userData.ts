import { UserData } from "../entities/UserData";
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { UserDataInput } from "./inputs/UserDataInput";
import { MyContext } from "../types/context";
import { isAuth } from "../middleware/isAuth";
import { PaginatedUserData } from "./types/Pagination";
import { AppDataSource } from "../dataSource";

@Resolver(UserData)
export class UserDataResolver {
  @Mutation(() => UserData)
  async create(
    @Arg("data") data: UserDataInput,
    @Ctx() { req }: MyContext
  ): Promise<UserData> {
    const userData = await UserData.create({
      data1: data.data1,
      data2: data.data2,
      userId: req.session.userId,
    }).save();

    return userData;
  }

  @Mutation(() => UserData)
  async update(
    @Arg("uuid") uuid: string,
    @Arg("data") data: UserDataInput
  ): Promise<UserData | null> {
    const userData = await UserData.findOneBy({ uuid: uuid });

    if (!userData) return null;

    for (const [key, value] of Object.entries(data)) {
      userData[key as keyof UserDataInput] = value;
    }
    await userData.save();

    return userData;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async delete(@Arg("uuid") uuid: string): Promise<Boolean> {
    const userData = await UserData.findOneBy({ uuid: uuid });
    if (!userData) return false;
    await userData.remove();
    return true;
  }

  @Query(() => PaginatedUserData)
  async userDatas(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedUserData> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const replacements: any[] = [realLimitPlusOne];

    const userDatas = await AppDataSource.query(
      `
    select d.*
    from userData d
    ${cursor ? `where d."createdAt" < $2` : ""}
    order by d."createdAt" DESC
    limit $1
    `,
      replacements
    );

    return {
      userDatas: userDatas.slice(0, realLimit),
      hasMore: userDatas.length === realLimitPlusOne,
    };
  }

  @Query(() => UserData)
  userData(@Arg("id", () => Int) id: number): Promise<UserData | null> {
    return UserData.findOneBy({ id: id });
  }
}
