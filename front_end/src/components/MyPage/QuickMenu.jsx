import "../../css/mypage/QuickMenu.css";
import { Link } from "react-router-dom";
import {
  FaBookmark,
  FaStar,
  FaClipboardList,
  FaGamepad,
  FaCoins,
} from "react-icons/fa";

const ITEMS = [
  {
    key: "saved",
    to: "/mypage",
    tone: "purple",
    Icon: FaBookmark,
    title: "번역 저장",
    desc: "저장한 번역 목록 보기",
  },
  {
    key: "favorite",
    to: "/mypage",
    tone: "mint",
    Icon: FaStar,
    title: "즐겨찾기 단어",
    desc: "내가 찜한 단어 보기",
  },
  {
    key: "test",
    to: "/test",
    tone: "pink",
    Icon: FaClipboardList,
    title: "나의 테스트 결과",
    desc: "테스트 기록 확인",
  },
  {
    key: "game",
    to: "/game",
    tone: "amber",
    Icon: FaGamepad,
    title: "맞추기 게임",
    desc: "용어 맞추고 포인트 받기",
  },
  {
    key: "point-shop",
    to: "/point-shop",
    tone: "violet",
    Icon: FaCoins,
    title: "포인트 상점",
    desc: "포인트로 아이템 구매",
  },
];

function QuickMenu() {
  return (
    <section className="mypage-card mypage-quick-card">
      <div className="mypage-card-head">
        <div>
          <span className="mypage-card-eyebrow">QUICK MENU</span>

          <h2 className="mypage-card-title">빠른 메뉴</h2>
        </div>
      </div>

      <div className="mypage-quick-grid">
        {ITEMS.map(({ key, to, tone, Icon, title, desc }) => (
          <Link key={key} to={to} className={`mypage-quick ${tone}`}>
            <div className="mypage-quick-icon-wrap">
              <Icon className="mypage-quick-icon" />
            </div>

            <p className="mypage-quick-title">{title}</p>

            <p className="mypage-quick-desc">{desc}</p>

            <span className="mypage-quick-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default QuickMenu;
