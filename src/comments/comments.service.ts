import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comments.entity';
import { User } from '../users/users.entity';
import { Post } from '../posts/posts.entity';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(Comment) private readonly repo: Repository<Comment>) { }

  create(content: string, user: User, post: Post) {
    const comment = this.repo.create({ content, user, post });
    return this.repo.save(comment);
  }

  async update(id: number, content: string, userId: number) {
    const comment = await this.repo.findOne({ where: { id }, relations: ['user'] });

    if (!comment) throw new Error('Comment not found');
    if (!comment.user) throw new Error('User not found');
    if (!comment.post) throw new Error('Post not found');

    if (comment.user.id !== userId) throw new Error('Unauthorized');
    comment.content = content;
    return this.repo.save(comment);
  }

  async remove(id: number, userId: number) {
    const comment = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!comment) throw new Error('Comment not found');
    if (!comment.user) throw new Error('User not found');
    if (!comment.post) throw new Error('Post not found');

    if (comment.user.id !== userId) throw new Error('Unauthorized');
    return this.repo.remove(comment);
  }
}