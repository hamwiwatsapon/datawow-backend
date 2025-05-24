import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post, Category } from './posts.entity';
import { User } from '../users/users.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

const mockPostRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockCategoryRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

describe('PostsService', () => {
  let service: PostsService;
  let repo: jest.Mocked<Repository<Post>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockPostRepo },
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepo },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repo = module.get(getRepositoryToken(Post));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const user = { id: 1 } as User;
    const category = new Category();
    category.id = 1;

    it('should throw if title or content is missing', () => {
      expect(() => service.create('', 'content', user, category)).toThrow(BadRequestException);
      expect(() => service.create('title', '', user, category)).toThrow(BadRequestException);
    });

    it('should throw if user is missing', () => {
      expect(() => service.create('title', 'content', null as any, category)).toThrow(BadRequestException);
    });

    it('should throw if category is invalid', () => {
      expect(() => service.create('title', 'content', user, {} as Category)).toThrow(BadRequestException);
    });

    it('should create and save post', async () => {
      const post = { id: 1, title: 'title', content: 'content', user, category };
      repo.create.mockReturnValue(post as any);
      repo.save.mockResolvedValue(post as any);
      const result = await service.create('title', 'content', user, category);
      expect(repo.create).toHaveBeenCalledWith({ title: 'title', content: 'content', user, category });
      expect(repo.save).toHaveBeenCalledWith(post);
      expect(result).toEqual(post);
    });
  });

  describe('findAll', () => {
    it('should return all posts with relations', async () => {
      const posts = [{ id: 1 } as Post];
      repo.find.mockResolvedValue(posts as any);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ relations: ['user', 'comments', 'category'] });
      expect(result).toEqual(posts);
    });
  });

  describe('findCategoryById', () => {
    it('should return category by id', async () => {
      const category = { id: 1 } as Category;
      categoryRepo.findOne.mockResolvedValue(category);
      const result = await service.findCategoryById(1);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(category);
    });
  });

  describe('update', () => {
    const user = { id: 1 } as User;
    const post = { id: 1, content: 'old', user } as Post;

    it('should throw if post not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update(1, 'new', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not owner', async () => {
      repo.findOne.mockResolvedValue({ ...post, user: { id: 2 } } as any);
      await expect(service.update(1, 'new', 1)).rejects.toThrow(UnauthorizedException);
    });

    it('should update and save post', async () => {
      repo.findOne.mockResolvedValue(post as any);
      repo.save.mockResolvedValue({ ...post, content: 'new' } as any);
      const result = await service.update(1, 'new', 1);
      expect(repo.save).toHaveBeenCalledWith({ ...post, content: 'new' });
      expect(result.content).toBe('new');
    });
  });

  describe('remove', () => {
    const user = { id: 1 } as User;
    const post = { id: 1, user } as Post;

    it('should throw if post not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not owner', async () => {
      repo.findOne.mockResolvedValue({ ...post, user: { id: 2 } } as any);
      await expect(service.remove(1, 1)).rejects.toThrow(UnauthorizedException);
    });

    it('should remove post', async () => {
      repo.findOne.mockResolvedValue(post as any);
      repo.remove.mockResolvedValue(post as any);
      const result = await service.remove(1, 1);
      expect(repo.remove).toHaveBeenCalledWith(post);
      expect(result).toEqual(post);
    });
  });

  describe('onModuleInit', () => {
    it('should create default categories if not exist', async () => {
      categoryRepo.findOne.mockResolvedValueOnce(null);
      categoryRepo.create.mockReturnValue({ name: 'history' } as any);
      categoryRepo.save.mockResolvedValue({ name: 'history' } as any);
      await service.onModuleInit();
      expect(categoryRepo.save).toHaveBeenCalled();
    });
  });
});
