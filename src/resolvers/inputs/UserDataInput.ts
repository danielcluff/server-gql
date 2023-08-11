import { UserData } from "../../entities/UserData";
import { Field, InputType } from "type-graphql";

@InputType()
export class UserDataInput implements Partial<UserData> {
  @Field()
  data1: string;

  @Field()
  data2: string;
}
