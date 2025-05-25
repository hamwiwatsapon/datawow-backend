import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post, Category } from './posts.entity';
import { Comment } from '../comments/comments.entity';
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

const mockCommentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});


describe('PostsService', () => {
  let service: PostsService;
  let repo: jest.Mocked<Repository<Post>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;
  let commentRepo: jest.Mocked<Repository<Comment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockPostRepo },
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepo },
        { provide: getRepositoryToken(Comment), useFactory: mockCommentRepo },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repo = module.get(getRepositoryToken(Post));
    categoryRepo = module.get(getRepositoryToken(Category));
    commentRepo = module.get(getRepositoryToken(Comment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create default categories if they do not exist', async () => {
      // Mock findOne to always return undefined (category does not exist)
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (categoryRepo.create as jest.Mock).mockImplementation((dto) => dto);
      (categoryRepo.save as jest.Mock).mockResolvedValue(undefined);

      await service.onModuleInit();

      const defaultCategories = [
        'history',
        'food',
        'pets',
        'health',
        'fashion',
        'exercise',
        'others',
      ];

      for (const name of defaultCategories) {
        expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { name } });
        expect(categoryRepo.create).toHaveBeenCalledWith({ name });
        expect(categoryRepo.save).toHaveBeenCalledWith({ name });
      }
    });

    it('should not create category if it already exists', async () => {
      // Mock findOne to always return a value (category exists)
      (categoryRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'history' });

      await service.onModuleInit();

      // Should call findOne for each, but not call save if found
      expect(categoryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create and save a post with valid data', async () => {
      const user = { id: 1 } as User;
      const category = new Category();
      category.id = 2;
      const post = { title: 't', content: 'c', user, category } as Post;
      (repo.create as jest.Mock).mockReturnValue(post);
      (repo.save as jest.Mock).mockResolvedValue(post);

      const result = await service.create('t', 'c', user, category);
      expect(repo.create).toHaveBeenCalledWith({ title: 't', content: 'c', user, category });
      expect(repo.save).toHaveBeenCalledWith(post);
      expect(result).toBe(post);
    });

    it('should throw BadRequestException if category is not instance of Category', async () => {
      const user = { id: 1 } as User;
      // @ts-ignore
      await expect(service.create('t', 'c', user, { id: 2 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if title or content is missing', async () => {
      const user = { id: 1 } as User;
      const category = new Category();
      await expect(service.create('', '', user, category)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is missing', async () => {
      const category = new Category();
      // @ts-ignore
      await expect(service.create('t', 'c', undefined, category)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    function createQueryBuilderMock(returnValue: any[] = []) {
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(returnValue),
      };
    }

    it('should return all posts with relations', async () => {
      const posts = [{ id: 1 } as Post];
      const queryBuilderMock = createQueryBuilderMock(posts);

      // @ts-ignore
      repo.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      const result = await service.findAll();
      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('post.comments', 'comments');
      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('comments.user', 'commentUser');
      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith('post.category', 'category');
      expect(queryBuilderMock.getMany).toHaveBeenCalled();
      expect(result).toEqual(posts);
    });

    it('should filter by categoryId', async () => {
      const posts = [{ id: 2 } as Post];
      const queryBuilderMock = createQueryBuilderMock(posts);

      // @ts-ignore
      repo.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      await service.findAll('5');
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('category.id = :categoryId', { categoryId: '5' });
    });

    it('should filter by search', async () => {
      const posts = [{ id: 3 } as Post];
      const queryBuilderMock = createQueryBuilderMock(posts);

      // @ts-ignore
      repo.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      await service.findAll(undefined, 'test');
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        '(LOWER(post.title) LIKE :search OR LOWER(user.username) LIKE :search)',
        { search: '%test%' }
      );
    });

    it('should filter by userId', async () => {
      const posts = [{ id: 4 } as Post];
      const queryBuilderMock = createQueryBuilderMock(posts);

      // @ts-ignore
      repo.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);

      await service.findAll(undefined, undefined, '7');
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('user.id = :userId', { userId: '7' });
    });
  });

  describe('findOne', () => {
    it('should return the post with relations if found', async () => {
      const post = { id: 1, title: 'Test', user: {}, comments: [], category: {} } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.findOne(1);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'comments', 'category', 'comments.user'],
      });
      expect(result).toBe(post);
    });

    it('should return undefined if post not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await service.findOne(999);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['user', 'comments', 'category', 'comments.user'],
      });
      expect(result).toBeUndefined();
    });
  });

  describe('findCategoryById', () => {
    it('should return the category if found', async () => {
      const category = { id: 1, name: 'food' } as any;
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.findCategoryById(1);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(category);
    });

    it('should return undefined if category not found', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      const result = await service.findCategoryById(999);
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update and save the post if found and user is authorized', async () => {
      const post = { id: 1, content: 'old', title: 'old', user: { id: 2 }, category: { id: 3 } } as any;
      const newCategory = { id: 4, name: 'new' } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(newCategory);
      (repo.save as jest.Mock).mockResolvedValue({ ...post, content: 'new', title: 'new', category: newCategory });

      const result = await service.update(1, 'new', 2, 'new', 4);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['user'] });
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 4 } });
      expect(repo.save).toHaveBeenCalledWith({ ...post, content: 'new', title: 'new', category: newCategory });
      expect(result).toEqual({ ...post, content: 'new', title: 'new', category: newCategory });
    });

    it('should throw NotFoundException if post not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.update(1, 'new', 2, 'new', 4)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const post = { id: 1, content: 'old', title: 'old', user: { id: 99 }, category: { id: 3 } } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);

      await expect(service.update(1, 'new', 2, 'new', 4)).rejects.toThrow(UnauthorizedException);
    });

    it('should keep the old category if new category not found', async () => {
      const post = { id: 1, content: 'old', title: 'old', user: { id: 2 }, category: { id: 3 } } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (repo.save as jest.Mock).mockResolvedValue({ ...post, content: 'new', title: 'new', category: post.category });

      const result = await service.update(1, 'new', 2, 'new', 999);

      expect(repo.save).toHaveBeenCalledWith({ ...post, content: 'new', title: 'new', category: post.category });
      expect(result).toEqual({ ...post, content: 'new', title: 'new', category: post.category });
    });
  });

  describe('remove', () => {
    it('should remove all comments and the post if found and user is authorized', async () => {
      const post = {
        id: 1,
        user: { id: 2 },
        comments: [{ id: 10 }, { id: 11 }]
      } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);
      (commentRepo.remove as jest.Mock).mockResolvedValue(undefined);
      (repo.remove as jest.Mock).mockResolvedValue(post);

      const result = await service.remove(1, 2);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['user', 'comments'] });
      expect(commentRepo.remove).toHaveBeenCalledWith(post.comments);
      expect(repo.remove).toHaveBeenCalledWith(post);
      expect(result).toBe(post);
    });

    it('should remove the post even if there are no comments', async () => {
      const post = {
        id: 1,
        user: { id: 2 },
        comments: []
      } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);
      (repo.remove as jest.Mock).mockResolvedValue(post);

      const result = await service.remove(1, 2);

      expect(commentRepo.remove).not.toHaveBeenCalled();
      expect(repo.remove).toHaveBeenCalledWith(post);
      expect(result).toBe(post);
    });

    it('should throw NotFoundException if post not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.remove(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const post = {
        id: 1,
        user: { id: 99 },
        comments: []
      } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(post);

      await expect(service.remove(1, 2)).rejects.toThrow(UnauthorizedException);
    });
  });


  describe('comment', () => {
    it('should add a comment to a post and save it', async () => {
      const user = { id: 1 } as User;
      const post = { id: 1, comments: [] } as any;
      const comment = { id: 10, content: 'Nice!', user, post } as any;

      (repo.findOne as jest.Mock).mockResolvedValue(post);
      (commentRepo.create as jest.Mock).mockReturnValue(comment);
      (repo.save as jest.Mock).mockResolvedValue({ ...post, comments: [comment] });

      const result = await service.comment(1, 'Nice!', user);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['comments'] });
      expect(commentRepo.create).toHaveBeenCalledWith({ content: 'Nice!', user, post });
      expect(post.comments).toContain(comment);
      expect(repo.save).toHaveBeenCalledWith(post);
      expect(result).toBe(comment);
    });

    it('should throw BadRequestException if content or user is missing', async () => {
      // @ts-ignore
      await expect(service.comment(1, '', null)).rejects.toThrow(BadRequestException);
      await expect(service.comment(1, '', { id: 1 } as User)).rejects.toThrow(BadRequestException);
      // @ts-ignore
      await expect(service.comment(1, 'Nice!', undefined)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if post not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.comment(1, 'Nice!', { id: 1 } as User)).rejects.toThrow(NotFoundException);
    });
  });
});
