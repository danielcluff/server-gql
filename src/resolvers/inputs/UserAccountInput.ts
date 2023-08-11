import { User } from "../../entities/User";
import { Field, InputType } from "type-graphql";

@InputType()
export class UserAccountInput implements Partial<User> {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
