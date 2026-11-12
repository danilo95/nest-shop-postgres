import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service.js';
import { initialData } from './data/seed-data.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { DataSource, Repository } from 'typeorm';
import { Purchase } from '../shop/entities/purchase.entity.js';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async executeSeed() {
    await this.deleteTables();
    const adminUser = await this.inserUsers();
    await this.insertNewProdcut(adminUser);
    return 'seed executed';
  }

  private async deleteTables() {
    // Seed de desarrollo: elimina dependencias antes de eliminar usuarios.
    // TypeORM no acepta .where({}) como criterio vacío.
    await this.dataSource
      .getRepository(Purchase)
      .createQueryBuilder()
      .delete()
      .execute();
    await this.productService.deleteAllProducts();
    await this.userRepository.createQueryBuilder().delete().execute();
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
