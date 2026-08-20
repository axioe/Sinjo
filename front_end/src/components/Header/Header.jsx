import "./Header.css";
import { Link } from "react-router-dom";
import { FaSearch, FaUser } from "react-icons/fa";
import { useAuth } from "../../AuthContext";
import translate from "../../assets/images/translate.png";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <img src={translate} alt="신세대 번역기" />
        </Link>
      </div>

      <nav className="nav-menu">
        <Link to="/translate">번역</Link>
        <Link to="/dictionary">사전</Link>
        <Link to="/game">게임</Link>
        <Link to="/ranking">랭킹</Link>
        <Link to="/today">오늘의 신조어</Link>
        <Link to="/mypage">마이페이지</Link>
      </nav>

      <div className="header-right">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="신조어 검색" />
        </div>
        {user ? (
          <div className="user-box">
            <FaUser />
            <span className="user-name">{user.nickname}님</span>
            <button className="logout-btn" onClick={logout}>
              로그아웃
            </button>
          </div>
        ) : (
          <Link to="/login" className="login-btn">
            <FaUser />
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
