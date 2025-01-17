import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRecoilValue, useRecoilState } from 'recoil';
import Menu from './Menu';
import Title from './Title';
import { authedUser, newNotification } from '../../atom';
import { Setting, SideMenuBox, Wrapper } from './index.style';
import SideBarDropdown from './SideBarDropdown';

const menuList = [
  { routeSrc: '/', imgSrc: '/home.svg', text: '홈', avatar: false },
  { routeSrc: '/notification', imgSrc: '/announce.svg', text: '알림', avatar: false },
  { routeSrc: '/search', imgSrc: '/search.svg', text: '검색', avatar: false },
];

type SideBarProps = {
  notiState?: boolean;
};

SideBar.defaultProps = {
  notiState: false,
};

export default function SideBar({ notiState }: React.PropsWithChildren<SideBarProps>) {
  const [dropdownState, setdropdownState] = useState<boolean>(false);
  const showSettingdropdown = () => {
    setdropdownState(!dropdownState);
  };
  const authedUserInfo = useRecoilValue(authedUser);
  const [newNotiState, setNewNotiState] = useRecoilState(newNotification);
  useEffect(() => {
    const eventSource = new EventSource('/api/event');
    if (!notiState) {
      eventSource.onmessage = (event) => {
        setNewNotiState(event.data);
      };
      eventSource.onerror = (error) => {
        console.error('SSE error', error);
      };
    }
    return () => eventSource.close();
  }, [notiState]);

  return (
    <Wrapper>
      <Title />
      <SideMenuBox>
        {menuList.map((item) => (
          <Link key={item.routeSrc} href={item.routeSrc}>
            <Menu imgSrc={item.imgSrc} text={item.text} avatar={false} noti={newNotiState} />
          </Link>
        ))}
        {authedUserInfo.logined && (
          <Link key={`/${authedUserInfo.userid}`} href={`/${authedUserInfo.userid}`}>
            <Menu imgSrc={authedUserInfo.profileimg} text={authedUserInfo.nickname} avatar noti={false} />
          </Link>
        )}
      </SideMenuBox>
      {dropdownState && <SideBarDropdown />}
      <Setting onClick={showSettingdropdown}>
        <Menu imgSrc="/setting.svg" text="설정" avatar={false} noti={false} />
      </Setting>
    </Wrapper>
  );
}
