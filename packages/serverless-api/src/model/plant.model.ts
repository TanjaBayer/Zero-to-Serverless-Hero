import { v4 } from 'uuid';

import { Model, PartitionKey } from '@cubesoft/dynamo-easy';
import { PlantInterface } from '../interface/plant.interface';

@Model({ tableName: 'data_table' })
export class PlantModel implements PlantInterface {
  @PartitionKey()
  id: string;

  name: string;
  description?: string;

  createdAt: number;
  updatedAt: number;

  constructor() {
    this.id = v4();
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
  }
}
