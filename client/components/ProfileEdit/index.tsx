import Router from 'next/router';
import React, { ChangeEvent, RefObject, useEffect, useRef, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers';
import { authedUser } from '../../atom';
import { ResponseType, httpGet } from '../../utils/http';
import { ButtonBack, TopBar } from '../../styles/common';
import getByteLength from '../../utils/getByteLength';
import {
  ProfileAndImgContainer,
  Wrapper,
  Avatar,
  ProfileArea,
  ProfileUserid,
  ProfileEmail,
  ChangeAvatarButton,
  InputsContainer,
  NicknameEditArea,
  BioEditArea,
  SubmitButton,
  NicknameInput,
  BioInput,
  ErrorMessage,
  ProfileImageInput,
  EditSection,
  ProfileImgForm,
} from './index.style';

interface ProfileEditable {
  nickname: string;
  bio: string;
  profileimg: string;
}

interface Profile extends ProfileEditable {
  userid: string;
  email: string;
}

const schema = yup.object().shape({
  nickname: yup
    .string()
    .matches(/^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/i, '영어, 숫자, 한글만 가능합니다.')
    .test({
      message: '16바이트 이내로 입력 가능합니다.',
      test: (value) => getByteLength(value as string) <= 16,
    }),
  bio: yup.string(),
});

export default function ProfileEditSection() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const goBack = () => {
    Router.back();
  };

  const authedUserInfo = useRecoilValue(authedUser);
  const setAuthedUserInfo = useSetRecoilState(authedUser);

  const [myProfile, setMyProfile] = useState<Profile>({
    userid: authedUserInfo.userid,
    email: '',
    nickname: authedUserInfo.nickname,
    bio: '',
    profileimg: authedUserInfo.profileimg,
  });
  const [profileImg, setProfileImg] = useState<File>();
  const [previewImg, setPreviewImg] = useState<string>();
  const selectFile: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);

  const handleImg = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!e.target.files) return;
    const image = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImg(image);
      if (reader.result !== null && reader.result !== undefined) setPreviewImg(reader.result as string);
    };
    if (image) reader.readAsDataURL(image);
  };

  useEffect(() => {
    httpGet(`/user/${authedUserInfo.userid}`).then((res: ResponseType) => {
      if (res.message === 'success') {
        setMyProfile(res.data);
      }
    });
  }, []);

  const handleNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMyProfile((prevProfile) => ({ ...prevProfile, nickname: e.target.value }));
  };

  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMyProfile((prevProfile) => ({ ...prevProfile, bio: e.target.value }));
  };

  const handleProfileImgSubmit = () => {
    // fetch('/api/user/')
    if (!profileImg) return;
    const formData = new FormData();
    formData.append('file', profileImg!);
    fetch(`/api/user/${myProfile.userid}/avatar`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    })
      .then(async (e) => {
        const res = await e.json();
        const url = res.data.profileimg;
        // profileImg수정
        setAuthedUserInfo((userInfo) => {
          const profileimg = url;
          return { ...userInfo, profileimg };
        });
        setProfileImg(undefined);
      })
      .catch((e) => {
        alert(e);
        console.error(e);
      });
  };

  const handleProfileSubmit = () => {
    // TODO : 별명, 소개로 밀어넣을 수 있는 값이 유효한지 확인해야 함..
    fetch(`/api/user/${myProfile.userid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        nickname: myProfile.nickname,
        bio: myProfile.bio,
      }),
    })
      .catch((e) => {
        alert('프로필 편집에 실패했습니다.');
        console.error(e);
      })
      .finally(() => {
        // Router.reload();
        goBack();
      });
  };

  return (
    <Wrapper>
      <TopBar>
        <div>
          <ButtonBack type="button" onClick={goBack} />
        </div>
        <h1>프로필 편집</h1>
      </TopBar>
      <EditSection>
        <ProfileImgForm onSubmit={handleSubmit(handleProfileImgSubmit)} encType="multipart/form-data">
          <ProfileAndImgContainer>
            <ProfileImageInput type="file" ref={selectFile} onChange={handleImg} accept="image/*" />
            <Avatar src={previewImg ?? myProfile.profileimg} onClick={() => selectFile.current!.click()} />
            <ProfileArea>
              <ProfileUserid>{myProfile.userid}</ProfileUserid>
              <ProfileEmail>{myProfile.email}</ProfileEmail>
              {previewImg && <ChangeAvatarButton type="submit">프로필 사진 저장</ChangeAvatarButton>}
            </ProfileArea>
          </ProfileAndImgContainer>
        </ProfileImgForm>
        <InputsContainer onSubmit={handleSubmit(handleProfileSubmit)}>
          <NicknameEditArea>
            <span>별명:</span>
            <NicknameInput {...register('nickname')} value={myProfile.nickname} onChange={handleNicknameChange} />
          </NicknameEditArea>
          <ErrorMessage>{errors.nickname && (errors.nickname.message as string)}</ErrorMessage>
          <BioEditArea>
            <span>소개:</span>
            <BioInput {...register('bio')} value={myProfile.bio} onChange={handleBioChange} />
          </BioEditArea>
          <ErrorMessage>{errors.bio && (errors.bio.message as string)}</ErrorMessage>
          <SubmitButton type="submit">저장</SubmitButton>
        </InputsContainer>
      </EditSection>
    </Wrapper>
  );
}
