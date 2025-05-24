import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const user = { username: 'test' } as User;
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      const result = await service.create('test');
      expect(repo.create).toHaveBeenCalledWith({ username: 'test' });
      expect(repo.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const user = { username: 'test' } as User;
      repo.findOne.mockResolvedValue(user);
      const result = await service.findByUsername('test');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { username: 'test' } });
      expect(result).toBe(user);
    });
  });

  describe('findOne', () => {
    it('should find user by id', async () => {
      const user = { id: 1 } as User;
      repo.findOne.mockResolvedValue(user);
      const result = await service.findOne(1);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(user);
    });
  });
});