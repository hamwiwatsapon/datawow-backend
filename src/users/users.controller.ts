import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('login')
  /**
   * Login a user by username. If the user does not exist, create a new user.
   * @param username The username of the user.
   * @returns The user object.
   */
  async login(@Body('username') username: string) {
    let user = await this.usersService.findByUsername(username);
    user ??= await this.usersService.create(username);
    return user;
  }
}