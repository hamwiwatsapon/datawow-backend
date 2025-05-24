import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comments.entity';
import { User } from '../users/users.entity';
import { Post } from '../posts/posts.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly repo: Repository<Comment>,
  ) { }

  async create(content: string, user: User, post: Post) {
    if (!content) throw new NotFoundException('Content is required');
    if (!user) throw new NotFoundException('User is required');
    if (!post) throw new NotFoundException('Post is required');
    const comment = this.repo.create({ content, user, post });
    return this.repo.save(comment);
  }

  async update(id: number, content: string, userId: number) {
    const comment = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!comment.user) throw new NotFoundException('User not found');
    if (comment.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    comment.content = content;
    return this.repo.save(comment);
  }

  async remove(id: number, userId: number) {
    const comment = await this.repo.findOne({ where: { id }, relations: ['user', 'post'] });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!comment.user) throw new NotFoundException('User not found');
    if (!comment.post) throw new NotFoundException('Post not found');
    if (comment.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    return this.repo.remove(comment);
  }
}