import { Controller, Post as HttpPost, Put, Delete, Body, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) { }

  @HttpPost(':postId')
  async create(@Param('postId') postId: string, @Body() body: { content: string; userId: number }) {
    const user = await this.usersService.findOne(body.userId);
    if (!user) {
      throw new Error('User not found');
    }
    const post = await this.postsService.findAll().then(posts => posts.find(p => p.id === +postId));
    if (!post) {
      throw new Error('Post not found');
    }
    return this.commentsService.create(body.content, user, post);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { content: string; userId: number }) {
    return this.commentsService.update(+id, body.content, body.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('userId') userId: number) {
    return this.commentsService.remove(+id, userId);
  }
}
