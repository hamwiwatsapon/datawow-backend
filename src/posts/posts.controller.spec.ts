import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            findCategoryById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should call postsService.findAll with query params', async () => {
      const mockResult = [{ id: 1 }];
      (postsService.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getAll('2', 'searchText', '3');
      expect(postsService.findAll).toHaveBeenCalledWith('2', 'searchText', '3');
      expect(result).toBe(mockResult);
    });
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const body = { title: 'Test', content: 'Content', userId: 1, categoryId: 2 };
      const user = { id: 1 };
      const category = { id: 2 };
      const createdPost = { id: 10, ...body };

      (postsService.create as jest.Mock).mockResolvedValue(createdPost);
      (usersService.findOne as jest.Mock).mockResolvedValue(user);
      (postsService.findCategoryById as jest.Mock).mockResolvedValue(category);

      const result = await controller.create(body);
      expect(usersService.findOne).toHaveBeenCalledWith(1);
      expect(postsService.findCategoryById).toHaveBeenCalledWith(2);
      expect(postsService.create).toHaveBeenCalledWith('Test', 'Content', user, category);
      expect(result).toBe(createdPost);
    });

    it('should throw NotFoundException if category not found', async () => {
      const body = { title: 'Test', content: 'Content', userId: 1, categoryId: 2 };
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (postsService.findCategoryById as jest.Mock).mockResolvedValue(undefined);

      await expect(controller.create(body)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      const body = { title: 'Test', content: 'Content', userId: 1, categoryId: 2 };
      (usersService.findOne as jest.Mock).mockResolvedValue(undefined);
      (postsService.findCategoryById as jest.Mock).mockResolvedValue({ id: 2 });

      await expect(controller.create(body)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if title or content is missing', async () => {
      const body = { title: '', content: '', userId: 1, categoryId: 2 };
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (postsService.findCategoryById as jest.Mock).mockResolvedValue({ id: 2 });

      await expect(controller.create(body)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getById', () => {
    it('should return a post if found', async () => {
      const post = { id: 1, title: 'Test' };
      (postsService.findOne as jest.Mock).mockResolvedValue(post);

      const result = await controller.getById(1);
      expect(postsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(post);
    });

    it('should throw NotFoundException if post not found', async () => {
      (postsService.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(controller.getById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should call postsService.update with correct params and return the result', async () => {
      const updatedPost = { id: 1, title: 'Updated', content: 'Updated content' };
      (postsService.update as jest.Mock).mockResolvedValue(updatedPost);

      const body = { content: 'Updated content', userId: 2, title: 'Updated', categoryId: 3 };
      const result = await controller.update('1', body);

      expect(postsService.update).toHaveBeenCalledWith(1, 'Updated content', 2, 'Updated', 3);
      expect(result).toBe(updatedPost);
    });
  });

  describe('remove', () => {
    it('should call postsService.remove with correct params and return the result', async () => {
      const removedPost = { id: 1, title: 'Deleted' };
      (postsService.remove as jest.Mock).mockResolvedValue(removedPost);

      const result = await controller.remove('1', 2);

      expect(postsService.remove).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(removedPost);
    });
  });
});
