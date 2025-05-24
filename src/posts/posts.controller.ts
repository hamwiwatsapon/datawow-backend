import { Controller, Get, Post as HttpPost, Put, Delete, Body, Param } from '@nestjs/common';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) { }

  @Get()
  getAll() {
    return this.postsService.findAll();
  }

  @HttpPost()
  async create(@Body() body: { title: string; content: string; userId: number }) {
    const user = await this.usersService.findOne(body.userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!body.title || !body.content) {
      throw new Error('Title and content are required');
    }

    return this.postsService.create(body.title, body.content, user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { content: string; userId: number }) {
    return this.postsService.update(+id, body.content, body.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('userId') userId: number) {
    return this.postsService.remove(+id, userId);
  }
}
