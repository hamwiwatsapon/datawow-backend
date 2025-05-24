import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('login')
  async login(@Body('username') username: string) {
    let user = await this.usersService.findByUsername(username);
    user ??= await this.usersService.create(username);
    return user;
  }
}