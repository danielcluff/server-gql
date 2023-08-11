import { Field, ObjectType } from "type-graphql";
import { DateEntity } from "./DateEntity";
import {
  Column,
  DeleteDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserData } from "./UserData";

@ObjectType()
@Entity()
export class User extends DateEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  @Generated("uuid")
  uuid: string;

  @Field()
  @Column({ unique: true })
  username: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  confirmed: boolean;

  @OneToMany(() => UserData, (data) => data.user)
  userData: UserData[];

  @DeleteDateColumn()
  deletedDate: Date;
}
