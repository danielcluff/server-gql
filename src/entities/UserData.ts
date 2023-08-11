import { Field, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  Generated,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DateEntity } from "./DateEntity";
import { User } from "./User";

@ObjectType()
@Entity()
export class UserData extends DateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  @Generated("uuid")
  uuid: string;

  @ManyToOne(() => User, (user) => user.userData)
  user: User;

  @Field()
  @Column()
  userId: string;

  @Field()
  @Column()
  data1: string;

  @Column()
  data2: string;
}
