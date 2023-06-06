import { PlantInterface } from '../interface/plant.interface';
import { Field, Float, ID, ObjectType } from 'type-graphql';

@ObjectType('PlantType', { description: 'Object representing a plant' })
export class PlantType implements PlantInterface {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float)
  createdAt: number;

  @Field(() => Float)
  updatedAt: number;
}
