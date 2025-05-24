import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './posts.entity';
import { User } from '../users/users.entity';

@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private readonly repo: Repository<Post>) { }

  create(title: string, content: string, user: User) {
    const post = this.repo.create({ title, content, user });
    return this.repo.save(post);
  }

  findAll() {
    return this.repo.find({ relations: ['user', 'comments'] });
  }

  async update(id: number, content: string, userId: number) {
    const post = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!post) throw new Error('Post not found');

    if (post.user.id !== userId) throw new Error('Unauthorized');
    post.content = content;
    return this.repo.save(post);
  }

  async remove(id: number, userId: number) {
    const post = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!post) throw new Error('Post not found');

    if (post.user.id !== userId) throw new Error('Unauthorized');
    return this.repo.remove(post);
  }
}
