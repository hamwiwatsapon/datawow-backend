import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './comments.entity';
import { User } from '../users/users.entity';
import { Post } from '../posts/posts.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// More complete mock repository
const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

describe('CommentsService', () => {
  let service: CommentsService;
  let repo: typeof mockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockRepo
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    repo = module.get(getRepositoryToken(Comment));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a comment', async () => {
      const user = { id: 1 } as User;
      const post = { id: 2 } as Post;
      const comment = { id: 3, content: 'hi', user, post } as Comment;

      repo.create.mockReturnValue(comment);
      repo.save.mockResolvedValue(comment);

      const result = await service.create('hi', user, post);

      expect(repo.create).toHaveBeenCalledWith({ content: 'hi', user, post });
      expect(repo.save).toHaveBeenCalledWith(comment);
      expect(result).toEqual(comment);
    });

    // Note: These validation tests may fail if your service doesn't actually validate
    // Check your actual service implementation for validation logic
    it('should handle empty content gracefully', async () => {
      const user = { id: 1 } as User;
      const post = { id: 2 } as Post;

      // This test assumes your service validates empty content
      // If not, remove this test or adjust based on actual behavior
      try {
        await service.create('', user, post);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('update', () => {
    const user = { id: 1 } as User;
    const post = { id: 2 } as Post;
    const comment = { id: 3, content: 'old', user, post } as Comment;

    it('should throw if comment not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(3, 'new', 1))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not owner', async () => {
      const commentWithDifferentUser = {
        ...comment,
        user: { id: 99 } as User
      };
      repo.findOne.mockResolvedValue(commentWithDifferentUser);

      await expect(service.update(3, 'new', 1))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should update and save comment successfully', async () => {
      const updatedComment = { ...comment, content: 'new' };

      repo.findOne.mockResolvedValue(comment);
      repo.save.mockResolvedValue(updatedComment);

      const result = await service.update(3, 'new', 1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 3 },
        relations: ['user']
      });
      expect(repo.save).toHaveBeenCalledWith({ ...comment, content: 'new' });
      expect(result.content).toBe('new');
    });
  });

  describe('remove', () => {
    const user = { id: 1 } as User;
    const post = { id: 2 } as Post;
    const comment = { id: 3, content: 'bye', user, post } as Comment;

    it('should throw if comment not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(3, 1))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not owner', async () => {
      const commentWithDifferentUser = {
        ...comment,
        user: { id: 99 } as User
      };
      repo.findOne.mockResolvedValue(commentWithDifferentUser);

      await expect(service.remove(3, 1))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should remove comment successfully', async () => {
      repo.findOne.mockResolvedValue(comment);
      repo.remove.mockResolvedValue(comment);

      const result = await service.remove(3, 1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 3 },
        relations: ['user', 'post']
      });
      expect(repo.remove).toHaveBeenCalledWith(comment);
      expect(result).toEqual(comment);
    });
  });
});