import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: Partial<Record<keyof PostsService, jest.Mock>>;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    postsService = {
      findAll: jest.fn(),
      findCategoryById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    usersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useValue: postsService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all posts', async () => {
      const posts = [{ id: 1 }, { id: 2 }];
      (postsService.findAll as jest.Mock).mockResolvedValue(posts);
      const result = await controller.getAll();
      expect(postsService.findAll).toHaveBeenCalled();
      expect(result).toBe(posts);
    });
  });

  describe('create', () => {
    const body = { title: 't', content: 'c', userId: 1, categoryId: 2 };

    it('should throw if category not found', async () => {
      (postsService.findCategoryById as jest.Mock).mockResolvedValue(null);
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      await expect(controller.create(body)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not found', async () => {
      (postsService.findCategoryById as jest.Mock).mockResolvedValue({ id: 2 });
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      await expect(controller.create(body)).rejects.toThrow(NotFoundException);
    });

    it('should throw if title or content missing', async () => {
      (postsService.findCategoryById as jest.Mock).mockResolvedValue({ id: 2 });
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      await expect(controller.create({ ...body, title: '' })).rejects.toThrow(BadRequestException);
      await expect(controller.create({ ...body, content: '' })).rejects.toThrow(BadRequestException);
    });

    it('should create post', async () => {
      const user = { id: 1 };
      const category = { id: 2 };
      const post = { id: 10, ...body, user, category };
      (postsService.findCategoryById as jest.Mock).mockResolvedValue(category);
      (usersService.findOne as jest.Mock).mockResolvedValue(user);
      (postsService.create as jest.Mock).mockResolvedValue(post);
      const result = await controller.create(body);
      expect(postsService.create).toHaveBeenCalledWith(body.title, body.content, user, category);
      expect(result).toBe(post);
    });
  });

  describe('update', () => {
    it('should call postsService.update', async () => {
      (postsService.update as jest.Mock).mockResolvedValue({ id: 1, content: 'new' });
      const result = await controller.update('1', { content: 'new', userId: 2 });
      expect(postsService.update).toHaveBeenCalledWith(1, 'new', 2);
      expect(result).toEqual({ id: 1, content: 'new' });
    });
  });

  describe('remove', () => {
    it('should call postsService.remove', async () => {
      (postsService.remove as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await controller.remove('1', 2);
      expect(postsService.remove).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({ id: 1 });
    });
  });
});
