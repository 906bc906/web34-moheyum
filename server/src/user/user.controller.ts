import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  HttpCode,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserUpdateDto } from './dto/user-Update-dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @HttpCode(200)
  @Get('/:userid')
  async getUserProfile(@Param('userid') userid: string) {
    return {
      message: 'success',
      data: await this.userService.getUserData(userid),
    };
  }

  @HttpCode(200)
  @Put('/:userid')
  async updateUserProfile(
    @Param('userid') userid: string,
    @Body() userUpdateDto: UserUpdateDto,
  ) {
    return {
      message: 'success',
      data: {
        profile: await this.userService.updateUserProfile(
          userid,
          userUpdateDto,
        ),
      },
    };
  }
}
