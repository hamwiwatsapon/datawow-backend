import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) { }

  create(username: string) {
    const user = this.repo.create({ username });
    return this.repo.save(user);
  }

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }
}
