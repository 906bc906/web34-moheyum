import { Injectable } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile-dto';
import { UserUpdateDto } from './dto/user-Update-dto';
import { UserRepository } from 'src/common/database/user.repository';
import { FollowRepository } from 'src/common/database/follow.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly followRepository: FollowRepository,
  ) {}

  async getUserData(userid: string): Promise<UserProfileDto> {
    return this.userRepository.findOneProfile({ userid });
  }

  async updateUserProfile(
    userid: string,
    userUpdateDto: UserUpdateDto,
  ): Promise<{
    userid: string;
    nickname: string;
    bio: string;
    profileImg: string;
  }> {
    const data = await this.userRepository.findOneAndUpdate(
      { userid: userid },
      userUpdateDto,
    );
    return Promise.resolve({
      userid: data.userid,
      nickname: data.nickname,
      bio: data.bio,
      profileImg: data.profileimg,
    });
  }

  async getMentionList(userid: string): Promise<
    {
      userid: string;
      nickname: string;
      profileimg: string;
    }[]
  > {
    const data = await this.followRepository.findUserToMention(userid);
    return data;
  }
  
  updateUserAvatar(userid: string, url: string) {
    return this.userRepository.findOneAndUpdate(
      {userid},
      {profileimg: url}
    )
  }
}
