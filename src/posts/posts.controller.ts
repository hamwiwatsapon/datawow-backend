import { Controller, Get, Post as HttpPost, Put, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) { }

  @Get()
  /**
   * Get all posts.
   * @returns An array of posts.
   */
  getAll() {
    return this.postsService.findAll();
  }

  @HttpPost()
  /**
   * Create a new post.
   * @param body The post data.
   * @returns The created post.
   */
  async create(@Body() body: { title: string; content: string; userId: number, categoryId: number }) {
    const user = await this.usersService.findOne(body.userId);
    const category = await this.postsService.findCategoryById(body.categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!body.title || !body.content) {
      throw new BadRequestException('Title and content are required');
    }

    return this.postsService.create(body.title, body.content, user, category);
  }

  @Put(':id')
  /**
   * Update a post by ID.
   * @param id The ID of the post to update.
   * @param body The updated post data.
   * @returns The updated post.
   */
  update(@Param('id') id: string, @Body() body: { content: string; userId: number }) {
    return this.postsService.update(+id, body.content, body.userId);
  }

  @Delete(':id')
  /**
   * Delete a post by ID.
   * @param id The ID of the post to delete.
   * @param userId The ID of the user who owns the post.
   * @returns The deleted post.
   */
  remove(@Param('id') id: string, @Body('userId') userId: number) {
    return this.postsService.remove(+id, userId);
  }
}
