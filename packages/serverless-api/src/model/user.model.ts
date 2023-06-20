import { v4 } from 'uuid';

import { Model, PartitionKey } from '@cubesoft/dynamo-easy';

@Model({ tableName: 'user_table' })
export class UserModel {
  @PartitionKey()
  id: string;

  email: string;

  createdAt: number;
  updatedAt: number;

  constructor() {
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
  }
}
