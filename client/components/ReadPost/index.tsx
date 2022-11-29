import Link from 'next/link';
import Router from 'next/router';
import { useRecoilValue } from 'recoil';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Image from 'next/legacy/image';
import ReactLoading from 'react-loading';
import { calcTime } from '../../utils/calctime';
import renderMarkdown from '../../utils/markdown';
import { authedUser } from '../../atom';
import COLORS from '../../styles/color';
import { ButtonBack, TopBar } from '../../styles/common';
import Paginator, { NEXT } from '../../utils/paginator';
import type PostProps from '../../types/Post';
import Comment, { commentItem } from './Comment';
import {
  Author,
  ContentBox,
  PostContent,
  PostedAt,
  HeaderBox,
  ProfileImg,
  Wrapper,
  AuthorDetail,
  CommentBox,
  Loader,
} from './index.style';

interface PostData {
  postData: PostProps;
}

export default function ReadPost({ postData }: PostData) {
  const authedUserInfo = useRecoilValue(authedUser);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = renderMarkdown(postData.description);
  }, []);
  const goBack = () => {
    Router.back();
  };
  let commentCount = 0;
  if (postData.childPosts) {
    commentCount = postData.childPosts.length;
  }
  const [nextCursor, setNextCursor] = useState(NEXT.START);
  const { loading, error, pages, next } = Paginator(`/api/post/comments/${postData._id}`, nextCursor);

  const observer = useRef<any>();
  const lastFollowElementRef = useCallback(
    (node: any) => {
      if (loading) return;
      if (error) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && next !== NEXT.END) {
            setNextCursor(next);
          }
        },
        {
          threshold: 0.4,
        }
      );
      if (node) observer.current.observe(node);
    },
    [loading, next !== NEXT.END]
  );
  console.log(pages);
  return (
    <Wrapper>
      <TopBar>
        <div>
          <div>
            <ButtonBack type="button" onClick={goBack} />
          </div>
          <h1>게시글</h1>
        </div>
      </TopBar>
      <PostContent>
        <HeaderBox>
          <Link href={`/${postData.author}`}>
            <Author>
              <ProfileImg>
                {postData.authorDetail.profileimg ? (
                  <Image src={postData.authorDetail.profileimg} alt="Logo" layout="fill" priority />
                ) : (
                  <Image src="/favicon.svg" alt="Logo" layout="fill" priority />
                )}
              </ProfileImg>
              <AuthorDetail>
                <div id="name">{postData.authorDetail.nickname || '작성자 이름'}</div>
                <div id="user-id">@{postData.author || '작성자 아이디'}</div>
              </AuthorDetail>
              <PostedAt>
                <div id="time">{calcTime(postData.createdAt)}</div>
                <div>&nbsp;</div>
              </PostedAt>
            </Author>
          </Link>
        </HeaderBox>
        <ContentBox ref={contentRef}>{postData.description || '글 내용'}</ContentBox>
        <CommentBox>
          <div id="title">답글: {commentCount}개</div>
          <div id="comment">
            <Link href={`/post/${postData._id}/comment`}>
              <ProfileImg>
                {postData.authorDetail.profileimg ? (
                  <Image src={postData.authorDetail.profileimg} alt="Logo" layout="fill" priority />
                ) : (
                  <Image src="/favicon.svg" alt="Logo" layout="fill" priority />
                )}
              </ProfileImg>
              <div id="text">답글 쓰기</div>
            </Link>
          </div>
          <div id="list">
            {pages.map((item: commentItem, index: number) => {
              if (pages.length === index + 1)
                return <Comment key={item._id} postData={item} ref={lastFollowElementRef}></Comment>;
              return <Comment key={item._id} postData={item}></Comment>;
            })}
          </div>
          <Loader>{loading && <ReactLoading type="spin" color={COLORS.PRIMARY} />}</Loader>
        </CommentBox>
      </PostContent>
    </Wrapper>
  );
}
