import { Controller, Post as HttpPost, Put, Delete, Body, Param, BadRequestException, NotFoundException } from '@nestjs/common';
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
  /**
   * Create a new comment on a post.
   * @param postId The ID of the post to comment on.
   * @param body The comment data.
   * @returns The created comment.
   */
  async create(@Param('postId') postId: string, @Body() body: { content: string; userId: number }) {
    if (!body.content || !body.userId) {
      throw new BadRequestException('Content and userId are required');
    }

    const user = await this.usersService.findOne(body.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postsService.findAll().then(posts => posts.find(p => p.id === +postId));
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.commentsService.create(body.content, user, post);
  }

  @Put(':id')
  /**
   * Update a comment by ID.
   * @param id The ID of the comment to update.
   * @param body The updated comment data.
   * @returns The updated comment.
   */
  update(@Param('id') id: string, @Body() body: { content: string; userId: number }) {
    return this.commentsService.update(+id, body.content, body.userId);
  }

  @Delete(':id')
  /**
   * Delete a comment by ID.
   * @param id The ID of the comment to delete.
   * @param userId The ID of the user who owns the comment.
   * @returns The deleted comment.
   */
  remove(@Param('id') id: string, @Body('userId') userId: number) {
    return this.commentsService.remove(+id, userId);
  }
}
