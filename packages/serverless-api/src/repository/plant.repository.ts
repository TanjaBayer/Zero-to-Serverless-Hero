import 'reflect-metadata';
import { Service } from 'typedi';

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoStore } from '@cubesoft/dynamo-easy';

import { PlantModel } from '../model/plant.model';

@Service()
export class PlantRepository {
  private dynamoDb = new DynamoDB({ region: 'eu-central-1' });
  constructor() {
    console.log('setup plant repository');
  }

  async putPlant(plant: PlantModel): Promise<PlantModel> {
    const store = new DynamoStore(PlantModel, this.dynamoDb);
    await store.put(plant).execFullResponse();
    return plant;
  }

  async deletePlant(id: string): Promise<void> {
    const store = new DynamoStore(PlantModel, this.dynamoDb);
    return store.delete({ PartitionKey: id }).exec();
  }

  async getPlant(id: string): Promise<PlantModel> {
    const store = new DynamoStore(PlantModel, this.dynamoDb);
    return store.get(id).exec();
  }

  async listPlants(): Promise<PlantModel[]> {
    const store = new DynamoStore(PlantModel, this.dynamoDb);
    return store.scan().exec();
  }
}
