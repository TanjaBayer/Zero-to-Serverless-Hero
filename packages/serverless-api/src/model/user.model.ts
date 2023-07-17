import { Model, PartitionKey } from '@cubesoft/dynamo-easy';
import { ScopeEnum } from '../enums/scope.enum';

@Model({ tableName: 'user_table' })
export class UserModel {
  @PartitionKey()
  id: string;

  email: string;

  createdAt: number;
  updatedAt: number;

  scopes: ScopeEnum[];

  constructor() {
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
  }
}
