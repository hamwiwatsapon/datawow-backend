import { BadRequestException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, Category } from './posts.entity';
import { User } from '../users/users.entity';
import { Comment } from '../comments/comments.entity';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectRepository(Post) private readonly repo: Repository<Post>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
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

  async create(title: string, content: string, user: User, category: Category): Promise<Post> {
    if (!title || !content) {
      throw new BadRequestException('Title and content are required');
    }
    if (!user) {
      throw new BadRequestException('User is required');
    }
    if (!(category instanceof Category)) {
      throw new BadRequestException('Category must be a Category instance');
    }
    const post = this.repo.create({ title, content, user, category });
    return this.repo.save(post);
  }

  async findAll(categoryId?: string, search?: string, userId?: string) {
    const query = this.repo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .leftJoinAndSelect('post.category', 'category');

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere(
        '(LOWER(post.title) LIKE :search OR LOWER(user.username) LIKE :search)',
        { search: `%${search.toLowerCase()}%` }
      );
    }

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    return await query.getMany();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['user', 'comments', 'category', 'comments.user'] });
  }

  findCategoryById(id: number) {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async update(id: number, content: string, userId: number, title: string, categoryId: number) {
    const post = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!post) throw new NotFoundException('Post not found');

    if (post.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    post.content = content;
    post.title = title;
    post.category = await this.categoryRepo.findOne({ where: { id: categoryId } }) ?? post.category
    return this.repo.save(post);
  }

  async remove(id: number, userId: number) {
    const post = await this.repo.findOne({ where: { id }, relations: ['user', 'comments'] });
    if (!post) throw new NotFoundException('Post not found');

    if (post.user.id !== userId) throw new UnauthorizedException('Unauthorized');

    // Remove all comments related to the post
    if (post.comments && post.comments.length > 0) {
      await this.commentRepo.remove(post.comments);
    }

    // Remove the post itself (other FK relations with cascade should be handled by DB or entity config)
    return this.repo.remove(post);
  }

  async comment(postId: number, content: string, user: User) {
    if (!content || !user) {
      throw new BadRequestException('Content and user are required');
    }

    const post = await this.repo.findOne({ where: { id: postId }, relations: ['comments'] });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.commentRepo.create({ content, user, post });
    post.comments.push(comment);
    await this.repo.save(post);
    return comment;
  }
}