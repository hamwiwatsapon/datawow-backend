import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Category, Post } from './posts.entity';
import { UsersModule } from '../users/users.module';
import { Comment } from '@/comments/comments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category, Comment]), UsersModule],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule { }
