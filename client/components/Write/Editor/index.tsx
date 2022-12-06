import React, { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState, useCallback, DragEvent } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import { useRecoilValue } from 'recoil';
import { authedUser } from '../../../atom';
import { httpPost, httpGet, httpPatch } from '../../../utils/http';
import renderMarkdown from '../../../utils/markdown';
import UserDropDown from './UserDropDown';
import { getLeftWidth } from '../../../styles/theme';
import UserProfile from '../../UserProfile';
import {
  BottomButtonConatiner,
  CommentTopBar,
  EditorContainer,
  EditorTabItem,
  EditorTabs,
  EditorTabTool,
  EditorTextBox,
  PostHeader,
  PreviewTextBox,
  ToolbarContainer,
  Wrapper,
} from './index.style';
import PostProps from '../../../types/Post';

interface Props {
  parentPostData?: {
    _id?: string;
  };
  modifyPostData?: PostProps;
  isComment?: number | null;
}

Editor.defaultProps = {
  parentPostData: {
    _id: '',
  },
  modifyPostData: null,
  isComment: null,
};

interface followUser {
  userid: string;
  nickname: string;
  profileimg: string;
}

let allMentionList: followUser[] = [];

export default function Editor({ parentPostData, modifyPostData, isComment }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [tabIndex, setTabIndex] = useState(0); // 0 Editor, 1 Preview
  const [content, setContent] = useState<string>('');
  const [dropDownDisplay, setDropDownDisplay] = useState<string>('none');
  const [dropDownPosition, setDropDownPosition] = useState<{ x: string; y: string }>({
    x: '0px',
    y: '0px',
  });
  const [checkMentionActive, setCheckMentionActive] = useState<boolean>(false);
  const [mentionList, setMentionList] = useState<string[]>([]);
  const [followList, setFollowList] = useState<followUser[]>([]);
  const [inputUserId, setInputUserId] = useState<string>('');
  const [contentHTML, setContentHTML] = useState<string>('<div><br></div>'); // 탭 전환용
  const [selectUser, setSelectUser] = useState<number>(0);
  const authedUserInfo = useRecoilValue(authedUser);

  const submitHandler = async () => {
    const removeDup = new Set(mentionList);
    const target = contentRef.current;
    if (!target) return;
    const postContent = target.innerHTML.replace(/<div>([\s\S]*?)<\/div>/g, '$1\n');

    // 수정의 경우
    if (modifyPostData) {
      const result = await httpPatch(`/post/${modifyPostData._id}`, {
        author: 1,
        description: postContent,
        parentPost: modifyPostData.parentPost,
      });
      if (result.statusCode !== 200) {
        alert(`글 수정에 실패했습니다.\nERROR statusCode: ${result.statusCode}\nERROR message: ${result.message}`);
        return;
      }
      Router.push(`/post/${modifyPostData._id}`);
      return;
    }

    // 새 글 쓰기
    const result = await httpPost('/post', {
      author: 1,
      description: postContent,
      parentPost: parentPostData?._id === '' ? null : parentPostData?._id,
      mentions: Array.from(removeDup),
    });
    if (result.statusCode !== 200) {
      alert(`글 작성에 실패했습니다.\nERROR statusCode: ${result.statusCode}\nERROR message: ${result.message}`);
      return;
    }
    Router.back();
  };

  const selectTab = (index: number) => {
    if (index === 0) {
      setTabIndex(0);
    }
    if (index === 1) {
      // preview
      if (!contentRef.current) return;
      setContentHTML(contentRef.current.innerHTML);
      setTabIndex(1);
    }
  };

  const fetchMentionList = async () => {
    const response = await httpGet('/user/mentionlist');
    allMentionList = [...response.data];
  };

  const checkIfModifying = () => {
    if (!modifyPostData || !contentRef.current) return;
    setContentHTML(modifyPostData.description);
    setContent(modifyPostData.description);
    contentRef.current.textContent = modifyPostData.description;
  };

  // 처음 렌더 될때만 전체 멘션 리스트 가져옴
  useEffect(() => {
    setDropDownPosition((prevState) => ({
      ...prevState,
      x: `${getLeftWidth(window.innerWidth) + 42}px`,
    }));
    fetchMentionList();
    checkIfModifying();
  }, []);

  // 사용자가 입력한 검색할 문자, 전체 mentionList에서 필터링
  useEffect(() => {
    if (inputUserId === '') {
      setFollowList([]);
      return;
    }
    const regex = new RegExp(`^${inputUserId}`);
    const filteredList = allMentionList.filter((user) => regex.test(user.userid) && user);
    setFollowList(filteredList.slice(0, 5));
  }, [inputUserId]);

  // 멘션 입력 시작,종료되었을 경우 (@키 누르면 멘션 시작, 종료: 엔터키로 입력 완료했거나, backspace 혹은 space 키로 취소했거나)
  useEffect(() => {
    if (!checkMentionActive) {
      setInputUserId('');
      setDropDownDisplay('none');
      setSelectUser(0);
    } else {
      setInputUserId('');
      moveDropDown(false);
      setFollowList(allMentionList.slice(0, 5));
      setDropDownDisplay('block');
      setSelectUser(0);
    }
  }, [checkMentionActive]);

  useEffect(() => {
    if (!previewRef.current || !contentRef.current) return;
    if (tabIndex === 1) {
      previewRef.current.innerHTML = renderMarkdown(content);
    } else if (contentHTML !== '<div><br></div>') contentRef.current.innerHTML = contentHTML;
  }, [tabIndex]);

  // 드롭다운 위치 갱신
  const moveDropDown = useCallback((isBack: boolean) => {
    const cursor = window.getSelection();
    if (cursor?.anchorNode?.nodeName !== '#text') return;
    const range = cursor?.getRangeAt(0);
    if (range) {
      const bounds = range.getBoundingClientRect();
      if (isBack) {
        setDropDownPosition({ x: `${bounds.x}px`, y: `${bounds.y + 5}px` });
        return;
      }
      setDropDownPosition({ x: `${bounds.x + 20}px`, y: `${bounds.y + 5}px` });
    }
  }, []);

  // ---------------------------------------------------------------------------------------------------------
  // 아래부터 에디터 제스쳐 관련 코드

  const pasteAction = (data: string) => {
    // console.log(JSON.stringify(data));
    const cursor = window.getSelection();
    if (!cursor) return;
    if (!contentRef.current) return;
    const collapseNode = cursor.anchorNode;
    if (cursor.type === 'Caret') {
      if (!cursor.anchorNode) return;
      const position = cursor.anchorNode.nodeType === 3 ? cursor.anchorOffset + data.length : 1;
      cursor.anchorNode.textContent = `${cursor.anchorNode?.textContent?.slice(
        0,
        cursor.anchorOffset
      )}${data}${cursor.anchorNode?.textContent?.slice(cursor.anchorOffset)}`;

      window.getSelection()?.collapse(collapseNode, position);
    }
    if (cursor.type === 'Range') {
      if (!cursor.anchorNode || !cursor.focusNode) return;
      cursor.deleteFromDocument();
      const position = cursor.anchorNode.nodeType === 3 ? cursor.anchorOffset + data.length : 1;
      cursor.anchorNode.textContent = `${cursor.anchorNode?.textContent?.slice(
        0,
        cursor.anchorOffset
      )}${data}${cursor.anchorNode?.textContent?.slice(cursor.anchorOffset)}`;
      window.getSelection()?.collapse(collapseNode, position);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.clipboardData?.getData('Text');
    pasteAction(data);
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const { key } = e;
    if (key === 'Backspace' || key === 'Delete') {
      if (contentRef.current.innerHTML === '' || contentRef.current.innerHTML === '<br>') {
        contentRef.current.innerHTML = '<div><br/></div>';
      }
    }
    setContent(contentRef.current.innerText.replace(/\n\n/g, '\n'));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const { key } = e;
    const cursor = window.getSelection();
    if (!cursor) return;
    const collapseNode = cursor.anchorNode;

    if (key === 'Backspace' || key === 'Delete') {
      if (contentRef.current.innerHTML === '<div><br></div>') {
        e.preventDefault();
        return;
      }
    }
    if (key === 'Tab') {
      e.preventDefault();
      if (cursor.type === 'Caret') {
        if (!cursor.anchorNode) return;
        const position = cursor.anchorNode.nodeType === 3 ? cursor.anchorOffset + 2 : 1;
        cursor.anchorNode.textContent = `${cursor.anchorNode?.textContent?.slice(
          0,
          cursor.anchorOffset
        )}\xa0\xa0${cursor.anchorNode?.textContent?.slice(cursor.anchorOffset)}`;

        window.getSelection()?.collapse(collapseNode, position);
      }
      if (cursor.type === 'Range') {
        if (!cursor.anchorNode || !cursor.focusNode) return;
        cursor.deleteFromDocument();
        const position = cursor.anchorNode.nodeType === 3 ? cursor.anchorOffset + 2 : 1;
        cursor.anchorNode.textContent = `${cursor.anchorNode?.textContent?.slice(
          0,
          cursor.anchorOffset
        )}\xa0\xa0${cursor.anchorNode?.textContent?.slice(cursor.anchorOffset)}`;
        window.getSelection()?.collapse(cursor.anchorNode, position);
      }
    }

    // 멘션 시작
    if (key === '@') {
      if (cursor.anchorNode?.nodeName === 'DIV') {
        setDropDownPosition((prevState) => ({
          ...prevState,
          y: isComment ? `${isComment + 216}px` : `${173}px`,
        }));
      }
      setCheckMentionActive(true);
      return;
    }

    // 멘션 종료 조건
    if (key === 'Backspace') {
      // @지우면 모달창 닫음, 멘션 active 종료
      if (checkMentionActive && /@\<\/div\>$/.test(contentRef.current.innerHTML)) {
        setCheckMentionActive(false);
        return;
        // 그외에는 멘션 active 유지.
      } else {
        setInputUserId((prevState) => prevState.slice(0, prevState.length - 1));
        setSelectUser(0);
        moveDropDown(true);
        return;
      }
    }

    if (checkMentionActive) {
      switch (key) {
        // 멘션 리스트 모달창 선택 대상 이동
        case 'ArrowDown':
          e.preventDefault();
          setSelectUser((prevState) => (prevState + 1 > followList.length - 1 ? 0 : prevState + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectUser((prevState) => (prevState - 1 < 0 ? followList.length - 1 : prevState - 1));
          break;
        // 멘션 입력 완료, 멘션 active 종료 => 드롭다운 리스트에서 고른 경우
        case 'Enter':
          e.preventDefault();
          let word: string = '';
          if (followList.at(selectUser)) {
            const userId = followList.at(selectUser)?.userid;
            if (userId?.slice(inputUserId.length)) word = userId?.slice(inputUserId.length);
          }
          pasteAction(`${word} `);
          setCheckMentionActive(false);
          if (word) {
            setMentionList((prevState) => prevState.concat(word));
          }
          break;
        // 멘션 입력 완료, 멘션 active 종료 => 직접 pullname 입력한 경우
        case ' ':
          e.preventDefault();
          const userInput = inputUserId;
          pasteAction(` `);
          setCheckMentionActive(false);
          if (userInput) {
            setMentionList((prevState) => prevState.concat(userInput));
          }
          break;
        default:
          // 멘션 키 active 상태일 때, 단어 입력하는 동안 발생하는 이벤트
          if (checkMentionActive && key.match(/^\w$/i)) {
            setInputUserId((prevState) => prevState + key);
            setSelectUser(0);
          } else if (key !== 'CapsLock' && key !== 'Shift') {
            setFollowList([]);
          }
          if (key !== 'CapsLock' && key !== 'Shift') {
            // 기능키 입력시 모달 이동 안함 (다른키 예외처리도 필요할 듯)
            moveDropDown(false); // 기능키 제외 문자키 입력마다 모달창 위치 계속 갱신해줘야함
          }
      }
    }
  };

  // ---------------------------------------------------------------------------------------------------------
  // 이미지 드래그 앤 드롭

  const dragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFiles = (files: FileList) => {
    const fetchImage = async () => {
      const response = await fetch(`/api/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      return response.json();
    };

    const formData = new FormData();
    formData.append('file', files[0]);

    if (contentRef.current) {
      const format: string = `${files[0].name.split('.').slice(-1)}`.toUpperCase();
      if (format === 'JPG' || format === 'JPEG' || format === 'PNG') {
        fetchImage()
          .then((imageData) => {
            const data = `![${files[0].name as string}](${imageData.imageLink})`;
            pasteAction(data);
            setContent(data); // setContent를 안하면 프리뷰에 반영이 안됩니다..
          })
          .catch((e) => alert(`이미지 업로드에 실패하였습니다. Error Message: ${e}`));
      } else {
        alert(`이미지 포맷을 확인해주세요.업로드 된 파일 이름 ${files[0].name} / 포맷 ${format}`);
      }
    }
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, []);

  // ---------------------------------------------------------------------------------------------------------

  return (
    <Wrapper>
      <CommentTopBar>
        <PostHeader>
          <Link href={`/${authedUserInfo.userid}`}>
            <UserProfile
              profileimg={authedUserInfo.profileimg}
              nickname={authedUserInfo.nickname}
              author={authedUserInfo.userid}
            />
          </Link>
        </PostHeader>
      </CommentTopBar>
      <ToolbarContainer>
        <EditorTabs>
          <EditorTabTool style={{ fontWeight: 'bold' }}>B</EditorTabTool>
          <EditorTabTool style={{ fontStyle: 'italic' }}>I</EditorTabTool>
          <EditorTabTool style={{ textDecorationLine: 'underline' }}>U</EditorTabTool>
        </EditorTabs>
        <EditorTabs>
          <EditorTabItem selected={tabIndex === 0} onClick={() => selectTab(0)}>
            마크다운
          </EditorTabItem>
          <EditorTabItem selected={tabIndex === 1} onClick={() => selectTab(1)}>
            미리보기
          </EditorTabItem>
        </EditorTabs>
      </ToolbarContainer>
      <EditorContainer>
        <EditorTextBox
          contentEditable={tabIndex === 0}
          ref={contentRef}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={dragOver}
          style={{ display: `${tabIndex === 0 ? 'block' : 'none'}` }}
          suppressContentEditableWarning
        >
          <div>
            <br />
          </div>
        </EditorTextBox>
        <PreviewTextBox ref={previewRef} style={{ display: `${tabIndex === 1 ? 'block' : 'none'}` }} />
        <input type="file" id="fileUpload" style={{ display: 'none' }} />
        {followList.length !== 0 && (
          <UserDropDown
            dropDownDisplay={dropDownDisplay}
            dropDownPosition={dropDownPosition}
            userList={followList}
            selectUser={selectUser}
          />
        )}
      </EditorContainer>
      <BottomButtonConatiner>
        <button type="button" onClick={submitHandler}>
          작성 완료
        </button>
      </BottomButtonConatiner>
    </Wrapper>
  );
}
