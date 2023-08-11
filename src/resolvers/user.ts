import argon2 from "argon2";
import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { UserAccountInput } from "./inputs/UserAccountInput";
import { MyContext } from "../types/context";
import { validatePassword, validateRegister } from "../utils/validateRegister";
import { UserResponse } from "./types/UserResponse";
import { createError } from "../utils/createError";
import {
  COOKIE_NAME,
  FORGET_PASSWORD_PREFIX,
} from "../configuration/constants";
import { isAuth } from "../middleware/isAuth";
// import { v4 } from "uuid";

@Resolver(User)
export class UserResolver {
  @Mutation(() => UserResponse)
  async createUser(
    @Arg("input") input: UserAccountInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(input);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(input.password);

    const user = await User.create({
      email: input.email,
      username: input.username,
      password: hashedPassword,
    }).save();

    req.session.userId = user.uuid;

    return { user };
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validatePassword(newPassword);
    if (errors) {
      return { errors };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const uuid = await redis.get(key);

    if (!uuid) {
      return createError("token", "Your token has expired.");
    }

    const user = await User.findOneBy({ uuid: uuid });

    if (!user) {
      return createError("token", "User no longer exists");
    }

    await User.update(
      { uuid: uuid },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    req.session.userId = user.uuid;

    return { user };
  }

  // @Mutation(() => Boolean)
  // async forgotPassword(
  //   @Arg("email") email: string,
  //   @Ctx() { redis}: MyContext
  // ) {
  //   const user = await User.findOneBy({email})
  //   if(!user) {
  //     return true
  //   }
  //   const token = v4()
  //   const threeDays = 1000 * 60 * 60 * 24 * 3

  //   await redis.set(
  //     FORGET_PASSWORD_PREFIX + token,
  //     user.id,
  //     "EX",
  //     threeDays
  //   )

  // Requires email capability not included in this repo
  //   // await sendEmail(
  //   //   email,
  //   //   `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
  //   // )

  //   return true
  // }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      return createError("usernameOrEmail", "That user does not exist");
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return createError("password", "Incorrect password.");
    }

    req.session.userId = user.uuid;

    return { user };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    await req.session.destroy();
    await res.clearCookie(COOKIE_NAME);
    return;
  }

  @Query(() => User, { nullable: true })
  async search(@Arg("params") username: string): Promise<User | null> {
    const firstUser = await User.findOneBy({ username: username });
    return firstUser;
  }

  @Mutation(() => User)
  @UseMiddleware(isAuth)
  async delete(@Arg("uuid") uuid: string): Promise<Boolean> {
    const user = await User.findOneBy({ uuid: uuid });
    if (!user) return false;
    User.remove(user);
    return true;
  }

  @Query(() => User, { nullable: true })
  currentUser(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOneBy({ uuid: req.session.userId });
  }

  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.uuid) {
      return user.email;
    }

    return "";
  }
}
