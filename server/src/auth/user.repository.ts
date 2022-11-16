import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model, FilterQuery } from 'mongoose';
import { UserCreateDto } from './dto/user-create-dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async createUser(userCreateDto: UserCreateDto): Promise<void> {
    const { userid, nickname, email, password } = userCreateDto;

    const newUser = new this.userModel({
      userid,
      nickname,
      email,
      password,
    });
    try {
      await newUser.save();
    } catch (error) {
      if (error.code === 11000) throw new ConflictException();
      else {
        console.error(error);
        throw new InternalServerErrorException();
      }
    }
  }

  async findOne(userFilterQuery: FilterQuery<User>): Promise<User> {
    return this.userModel.findOne(userFilterQuery);
  }
}
