import "./Header.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaUser } from "react-icons/fa";
import { useAuth } from "../../AuthContext";
import { getWords } from "../../api/wordApi";
import translate from "../../assets/images/translate.png";

function Header() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [searchWord, setSearchWord] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    const keyword = searchWord.trim();

    if (!keyword) {
      return;
    }

    try {
      const words = await getWords();

      const foundWord = words.find(
        (item) => item.word?.trim().toLowerCase() === keyword.toLowerCase(),
      );

      if (foundWord) {
        navigate(`/dictionary/${foundWord.id}`);

        setSearchWord("");
      } else {
        alert("검색한 신조어를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error(err);

      alert("신조어 검색에 실패했습니다.");
    }
  };

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
        {user &&
          (user.role === "ADMIN" ? (
            <Link to="/admin">관리자 페이지</Link>
          ) : (
            <Link to="/mypage">마이페이지</Link>
          ))}
      </nav>

      <div className="header-right">
        <form className="search-box" onSubmit={handleSearch}>
          <FaSearch className="search-icon" />

          <input
            type="text"
            placeholder="신조어 검색"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
          />
        </form>

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
