import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBookmark,
  FaUser,
  FaStar,
  FaClipboardList,
  FaGamepad,
  FaChartBar,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaCoins,
} from "react-icons/fa";

import { useAuth } from "../../AuthContext";

const MENUS = [
  {
    key: "home",
    label: "마이페이지",
    Icon: FaHome,
  },
  {
    key: "saved",
    label: "번역 저장",
    Icon: FaBookmark,
  },
  {
    key: "profile",
    label: "유저 정보 변경",
    Icon: FaUser,
  },
  {
    key: "favorite",
    label: "즐겨찾기 단어",
    Icon: FaStar,
  },
  {
    key: "test",
    label: "나의 테스트 결과",
    Icon: FaClipboardList,
  },
  {
    key: "game",
    label: "게임 기록",
    Icon: FaGamepad,
  },
  {
    key: "stats",
    label: "활동 통계",
    Icon: FaChartBar,
  },
  {
    key: "alarm",
    label: "알림",
    Icon: FaBell,
  },
  {
    key: "setting",
    label: "설정",
    Icon: FaCog,
  },
];

function MyPageSidebar({ active, onSelect }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const handlePointShop = () => {
    navigate("/point-shop");
  };

  return (
    <aside className="mypage-sidebar">
      <div className="mypage-sidebar-header">
        <div className="mypage-sidebar-logo">💜</div>

        <div>
          <h2>마이페이지</h2>
          <p>나의 활동을 한눈에 확인하세요</p>
        </div>
      </div>

      <nav className="mypage-sidebar-menu">
        {MENUS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`mypage-sidebar-menu-item ${
              active === key ? "active" : ""
            }`}
            onClick={() => onSelect(key)}
          >
            <Icon className="mypage-sidebar-menu-icon" />

            <span className="mypage-sidebar-menu-label">{label}</span>
          </button>
        ))}

        <button
          type="button"
          className="mypage-sidebar-menu-item point-shop-menu"
          onClick={handlePointShop}
        >
          <FaCoins className="mypage-sidebar-menu-icon" />

          <span className="mypage-sidebar-menu-label">포인트 상점</span>

          <span className="mypage-sidebar-new">SHOP</span>
        </button>

        <div className="mypage-sidebar-divider" />

        <button
          type="button"
          className="mypage-sidebar-menu-item logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="mypage-sidebar-menu-icon" />

          <span className="mypage-sidebar-menu-label">로그아웃</span>
        </button>
      </nav>

      <div className="mypage-sidebar-footer">
        <div className="mypage-sidebar-tip-icon">💡</div>

        <div>
          <strong>TIP</strong>

          <p>
            번역하고 게임을 플레이하면서
            <br />
            포인트와 배지를 모아보세요!
          </p>
        </div>
      </div>
    </aside>
  );
}

export default MyPageSidebar;
