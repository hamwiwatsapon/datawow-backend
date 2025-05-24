import { BadRequestException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, Category } from './posts.entity';
import { User } from '../users/users.entity';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectRepository(Post) private readonly repo: Repository<Post>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) { }

  async onModuleInit() {
    const defaultCategories = [
      'history',
      'food',
      'pets',
      'health',
      'fashion',
      'exercise',
      'others',
    ];

    for (const name of defaultCategories) {
      const exists = await this.categoryRepo.findOne({ where: { name } });
      if (!exists) {
        await this.categoryRepo.save(this.categoryRepo.create({ name }));
      }
    }
  }

  create(title: string, content: string, user: User, category: Category) {
    if (category && !(category instanceof Category)) {
      throw new BadRequestException('Invalid category');
    }

    if (!title || !content) {
      throw new BadRequestException('Title and content are required');
    }
    if (!user) {
      throw new BadRequestException('User is required');
    }
    const post = this.repo.create({ title, content, user, category });
    return this.repo.save(post);
  }

  findAll() {
    return this.repo.find({ relations: ['user', 'comments', 'category'] });
  }

  findCategoryById(id: number) {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async update(id: number, content: string, userId: number) {
    const post = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!post) throw new NotFoundException('Post not found');

    if (post.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    post.content = content;
    return this.repo.save(post);
  }

  async remove(id: number, userId: number) {
    const post = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!post) throw new NotFoundException('Post not found');

    if (post.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    return this.repo.remove(post);
  }
}