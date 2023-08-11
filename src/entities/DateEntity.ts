import { Field, ObjectType } from "type-graphql";
import { BaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
export class DateEntity extends BaseEntity {
  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updateAt: Date;
}
