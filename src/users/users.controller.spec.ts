import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an existing user if found', async () => {
      const user = { username: 'test' };
      (usersService.findByUsername as jest.Mock).mockResolvedValue(user);
      const result = await controller.login('test');
      expect(usersService.findByUsername).toHaveBeenCalledWith('test');
      expect(result).toBe(user);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should create and return a user if not found', async () => {
      const user = { username: 'test' };
      (usersService.findByUsername as jest.Mock).mockResolvedValue(undefined);
      (usersService.create as jest.Mock).mockResolvedValue(user);
      const result = await controller.login('test');
      expect(usersService.findByUsername).toHaveBeenCalledWith('test');
      expect(usersService.create).toHaveBeenCalledWith('test');
      expect(result).toBe(user);
    });
  });
});