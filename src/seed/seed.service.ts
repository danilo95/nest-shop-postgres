import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service.js';
import { initialData } from './data/seed-data.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async executeSeed() {
    await this.deleteTables();
    const adminUser = await this.inserUsers();
    await this.insertNewProdcut(adminUser);
    return 'seed executed';
  }

  private async deleteTables() {
    await this.productService.deleteAllProducts();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async inserUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach((user) => {
      users.push(this.userRepository.create(user));
    });
    const dbUser = await this.userRepository.save(users);

    return dbUser[0];
  }

  private async insertNewProdcut(user: User) {
    await this.productService.deleteAllProducts();
    const products = initialData.products;
    const insertPromises = products.map((product) =>
      this.productService.create(product, user),
    );
    await Promise.all(insertPromises);
    return true;
  }
}
