import React from 'react';
import { Link } from 'react-router-dom';
import { IoIosLogIn, IoIosLogOut, IoMdHome } from "react-icons/io";
import { FaBookOpen } from "react-icons/fa";
import { TbTargetArrow } from "react-icons/tb";
import { MdOutlineTaskAlt } from "react-icons/md";
import UserInfo from "./UserInfo";

interface SidebarProps {
  isAuth: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isAuth, onLogout }) => {
  return (
      <nav className="w-16 bg-gray-600 text-white flex flex-col items-start py-10 text-xs h-full">
        <div className="flex flex-col items-center justify-center">
          <UserInfo />
          <Link to="/" className="p-2"><IoMdHome /> ホーム</Link>
          <Link to="/" className="p-2"><TbTargetArrow /> 目標</Link>
          <Link to="/goallist" className="p-2"><MdOutlineTaskAlt /> タスクリスト</Link>
          <Link to="/CreatePost" className="p-2"><FaBookOpen /> 学習記録</Link>
        </div>
        <div className="flex flex-col items-center justify-center w-full mt-auto">
          {isAuth ? (
            <button onClick={onLogout} className="p-2"><IoIosLogOut /> ログアウト</button>
          ) : (
            <>
              <Link to="/login" className="p-2"><IoIosLogIn /> ログイン</Link>
              <Link to="/register" className="p-2">Register</Link>
            </>
          )}
        </div>
      </nav>
  );
};

export default Sidebar;