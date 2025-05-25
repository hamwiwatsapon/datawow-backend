import { Controller, Get, Post as HttpPost, Put, Delete, Body, Param, NotFoundException, BadRequestException, Query, ParseIntPipe } from '@nestjs/common';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) { }

  @Get()
  getAll(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string
  ) {
    return this.postsService.findAll(categoryId, search, userId);
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

  @Get(':id')
  /**
   * Get a post by ID.
   * @param id The ID of the post to retrieve.
   * @returns The post with the specified ID.
   * */
  async getById(@Param('id') id: number) {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  @Put(':id')
  /**
   * Update a post by ID.
   * @param id The ID of the post to update.
   * @param body The updated post data.
   * @returns The updated post.
   */
  update(@Param('id') id: string, @Body() body: { content: string; userId: number; title: string, categoryId: number }) {
    return this.postsService.update(+id, body.content, body.userId, body.title, body.categoryId);
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
