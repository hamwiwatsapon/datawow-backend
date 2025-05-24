import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: Partial<Record<keyof CommentsService, jest.Mock>>;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let postsService: Partial<Record<keyof PostsService, jest.Mock>>;

  beforeEach(async () => {
    commentsService = {
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    usersService = {
      findOne: jest.fn(),
    };
    postsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        { provide: CommentsService, useValue: commentsService },
        { provide: UsersService, useValue: usersService },
        { provide: PostsService, useValue: postsService },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const postId = '1';
    const user = { id: 2 };
    const post = { id: 1 };
    const body = { content: 'hello', userId: 2 };

    it('should throw if content or userId missing', async () => {
      await expect(controller.create(postId, { content: '', userId: 2 })).rejects.toThrow(BadRequestException);
      await expect(controller.create(postId, { content: 'hi', userId: undefined as any })).rejects.toThrow(BadRequestException);
    });

    it('should throw if user not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      await expect(controller.create(postId, body)).rejects.toThrow(NotFoundException);
    });

    it('should throw if post not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(user);
      (postsService.findAll as jest.Mock).mockResolvedValue([]);
      await expect(controller.create(postId, body)).rejects.toThrow(NotFoundException);
    });

    it('should create comment', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(user);
      (postsService.findAll as jest.Mock).mockResolvedValue([post]);
      (commentsService.create as jest.Mock).mockResolvedValue({ id: 10, content: 'hello', user, post });
      const result = await controller.create(postId, body);
      expect(commentsService.create).toHaveBeenCalledWith('hello', user, post);
      expect(result).toEqual({ id: 10, content: 'hello', user, post });
    });
  });

  describe('update', () => {
    it('should call commentsService.update', async () => {
      (commentsService.update as jest.Mock).mockResolvedValue({ id: 1, content: 'updated' });
      const result = await controller.update('1', { content: 'updated', userId: 2 });
      expect(commentsService.update).toHaveBeenCalledWith(1, 'updated', 2);
      expect(result).toEqual({ id: 1, content: 'updated' });
    });
  });

  describe('remove', () => {
    it('should call commentsService.remove', async () => {
      (commentsService.remove as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await controller.remove('1', 2);
      expect(commentsService.remove).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({ id: 1 });
    });
  });
});
