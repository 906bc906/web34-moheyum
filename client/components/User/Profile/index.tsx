import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import Link from 'next/link';
import {
  ProfileAvatar,
  ProfileBio,
  ProfileContainer,
  ProfileCounters,
  ProfileDetail,
  ProfileEditButton,
  ProfileNames,
  ProfileNickname,
  ProfileUserid,
} from './index.style';
import ProfileCounter from './ProfileCounter';
import { authedUser } from '../../../atom';
import { httpGet } from '../../../utils/http';
import { UserPostProps } from '../../../types/Post';

function UserProfile({ userData }: { userData: UserPostProps }) {
  const authedUserInfo = useRecoilValue(authedUser);
  const [imFollowing, setImFollowing] = useState(false);
  const [imfLoading, setImfLoading] = useState(true);

  useEffect(() => {
    httpGet(`/follow/check/${userData.userid}`).then((res) => {
      if (res.message === 'success') {
        setImfLoading(false);
        setImFollowing(res.data.isFollow);
      }
    });
  }, []);

  const cancleFollow = () => {
    fetch(`/api/follow/following/${userData.userid}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.message === 'success') {
          setImFollowing(false);
        }
      });
  };

  const submitFollow = () => {
    fetch(`/api/follow/following/${userData.userid}`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.message === 'success') setImFollowing(true);
      });
  };

  return (
    <ProfileContainer>
      <ProfileAvatar src={userData.profileimg} />
      <ProfileDetail>
        <ProfileNames>
          <ProfileNickname>
            {userData.nickname}
            {authedUserInfo.logined && authedUserInfo.userid === userData.userid && (
              <Link href={`/${userData.userid}/profileEdit`}>
                <ProfileEditButton>프로필 편집</ProfileEditButton>
              </Link>
            )}
            {authedUserInfo.logined &&
              authedUserInfo.userid !== userData.userid &&
              !imfLoading &&
              imFollowing === false && <ProfileEditButton onClick={submitFollow}>팔로우</ProfileEditButton>}
            {authedUserInfo.logined &&
              authedUserInfo.userid !== userData.userid &&
              !imfLoading &&
              imFollowing === true && <ProfileEditButton onClick={cancleFollow}>팔로우 취소</ProfileEditButton>}
          </ProfileNickname>
          <ProfileUserid>{userData.userid}</ProfileUserid>
        </ProfileNames>
        <ProfileCounters>
          <ProfileCounter url="" label="게시글" counter={userData.postcount} />
          <ProfileCounter url={`/${userData.userid}/follower`} label="팔로워" counter={userData.follower} />
          <ProfileCounter url={`/${userData.userid}/following`} label="팔로잉" counter={userData.following} />
        </ProfileCounters>
        <ProfileBio>{userData.bio}</ProfileBio>
      </ProfileDetail>
    </ProfileContainer>
  );
}

export default UserProfile;
