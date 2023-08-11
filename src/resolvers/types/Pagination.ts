import { UserData } from "../../entities/UserData";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PaginatedUserData {
  @Field(() => [UserData])
  userDatas: UserData[];

  @Field()
  hasMore: boolean;
}
