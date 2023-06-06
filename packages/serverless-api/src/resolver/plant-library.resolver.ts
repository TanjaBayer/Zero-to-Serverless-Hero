import 'reflect-metadata';
import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { PlantType } from '../model/plant.type';
import { PlantRepository } from '../repository/plant.repository';
import { Service } from 'typedi';
import { PlantModel } from '../model/plant.model';

@Service()
@Resolver()
export class PlantLibraryResolver {
  constructor(private readonly plantRepository: PlantRepository) {}
  @Query(() => [PlantType], {
    description: 'Returns a list of plants.',
  })
  async getPlants(): Promise<PlantType[]> {
    return this.plantRepository.listPlants();
  }

  @Mutation(() => PlantType, {
    description: 'Add a new plant to the library.',
  })
  async addPlant(
    @Arg('name', () => String) name: string,
    @Arg('description', () => String) description: string
  ): Promise<PlantType> {
    const plant = new PlantModel();
    plant.name = name;
    plant.description = description;

    return this.plantRepository.createOrUpdatePlant(plant);
  }
}
