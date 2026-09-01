import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCoins, FaShoppingBag, FaCheck } from "react-icons/fa";

import "../../css/mypage/PointShop.css";
import { POINT_BALANCE } from "./MyPage";

const ITEMS = [
  {
    id: 1,
    icon: "🎨",
    name: "프로필 테마",
    description: "마이페이지 프로필을 나만의 분위기로 꾸밀 수 있어요.",
    price: 300,
    color: "purple",
  },
  {
    id: 2,
    icon: "🏷️",
    name: "닉네임 뱃지",
    description: "프로필에 특별한 닉네임 뱃지를 표시할 수 있어요.",
    price: 500,
    color: "blue",
  },
  {
    id: 3,
    icon: "✨",
    name: "반짝반짝 효과",
    description: "프로필에 특별한 반짝임 효과를 추가할 수 있어요.",
    price: 700,
    color: "yellow",
  },
  {
    id: 4,
    icon: "👑",
    name: "VIP 뱃지",
    description: "특별한 VIP 뱃지로 프로필을 꾸밀 수 있어요.",
    price: 1000,
    color: "pink",
  },
];

function PointShop() {
  const navigate = useNavigate();

  const [purchasedIds, setPurchasedIds] = useState([]);

  const handlePurchase = (item) => {
    if (POINT_BALANCE < item.price) {
      window.alert(
        `포인트가 부족합니다.\n\n현재 포인트: ${POINT_BALANCE.toLocaleString()}P`,
      );

      return;
    }

    const confirmed = window.confirm(
      `${item.name}을(를) 구매하시겠습니까?\n\n` +
        `가격: ${item.price.toLocaleString()}P\n` +
        `현재 포인트: ${POINT_BALANCE.toLocaleString()}P`,
    );

    if (!confirmed) {
      return;
    }

    /*
     * 현재 포인트 구매 API가 연결되지 않았기 때문에
     * 실제 구매 처리는 하지 않는다.
     *
     * 추후:
     *
     * const result = await purchasePointItem(item.id);
     *
     * 형태로 교체하면 된다.
     */
    window.alert(`${item.name} 구매 기능은 현재 준비 중입니다.`);

    /*
     * 실제 API 연결 시에는 이 부분을
     * API 성공 이후 실행하면 된다.
     */
    setPurchasedIds((prev) => [...prev, item.id]);
  };

  return (
    <main className="point-shop-page">
      {/* HERO */}
      <section className="point-shop-hero">
        <div
          className="point-shop-hero-decoration point-shop-hero-decoration-one"
          aria-hidden="true"
        />

        <div
          className="point-shop-hero-decoration point-shop-hero-decoration-two"
          aria-hidden="true"
        />

        <button
          type="button"
          className="point-shop-back"
          onClick={() => navigate("/mypage")}
          aria-label="마이페이지로 돌아가기"
        >
          <FaArrowLeft aria-hidden="true" />
          <span>마이페이지</span>
        </button>

        <div className="point-shop-hero-content">
          <span className="point-shop-eyebrow">POINT SHOP</span>

          <h1>
            모은 포인트로
            <br />
            나만의 아이템을 만나보세요.
          </h1>

          <p>
            번역하고 게임을 플레이하며 모은 포인트를
            <br />
            다양한 아이템으로 교환할 수 있어요.
          </p>
        </div>

        <div className="point-shop-balance-card">
          <div className="point-shop-balance-icon">
            <FaCoins aria-hidden="true" />
          </div>

          <div>
            <span>MY POINT</span>

            <strong>
              {POINT_BALANCE.toLocaleString()}
              <small>P</small>
            </strong>
          </div>
        </div>
      </section>

      {/* NOTICE */}
      <section className="point-shop-notice">
        <div className="point-shop-notice-icon" aria-hidden="true">
          💡
        </div>

        <div className="point-shop-notice-content">
          <strong>포인트는 어떻게 모을까요?</strong>

          <p>단어를 번역하거나 게임을 플레이하면서 활동 포인트를 모아보세요.</p>
        </div>

        <div className="point-shop-notice-badge">
          <FaCheck aria-hidden="true" />
          활동 보상
        </div>
      </section>

      {/* SHOP */}
      <section className="point-shop-section">
        <div className="point-shop-section-header">
          <div>
            <span>SHOP ITEMS</span>

            <h2>상점 아이템</h2>

            <p>원하는 아이템을 선택해 보세요.</p>
          </div>

          <div className="point-shop-count">{ITEMS.length} ITEMS</div>
        </div>

        <div className="point-shop-grid">
          {ITEMS.map((item) => {
            const canPurchase = POINT_BALANCE >= item.price;

            const purchased = purchasedIds.includes(item.id);

            return (
              <article
                key={item.id}
                className={`point-shop-item ${item.color}`}
              >
                <div className="point-shop-item-bg" aria-hidden="true" />

                <div className="point-shop-item-top">
                  <div className="point-shop-item-icon" aria-hidden="true">
                    {item.icon}
                  </div>

                  <span className="point-shop-item-tag">ITEM</span>
                </div>

                <div className="point-shop-item-content">
                  <h3>{item.name}</h3>

                  <p>{item.description}</p>
                </div>

                <div className="point-shop-item-bottom">
                  <div className="point-shop-price">
                    <span>PRICE</span>

                    <strong>
                      {item.price.toLocaleString()}
                      <small>P</small>
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      purchased ? "purchased" : !canPurchase ? "disabled" : ""
                    }
                    disabled={!canPurchase || purchased}
                    onClick={() => handlePurchase(item)}
                  >
                    {purchased ? (
                      <>
                        <FaCheck aria-hidden="true" />
                        구매 완료
                      </>
                    ) : (
                      <>
                        <FaShoppingBag aria-hidden="true" />
                        {canPurchase ? "구매하기" : "포인트 부족"}
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FOOTER INFO */}
      <section className="point-shop-footer-card">
        <div className="point-shop-footer-icon" aria-hidden="true">
          🎁
        </div>

        <div>
          <h3>더 많은 아이템이 추가될 예정이에요.</h3>

          <p>앞으로 다양한 프로필 꾸미기 아이템과 보상 콘텐츠를 만나보세요.</p>
        </div>
      </section>
    </main>
  );
}

export default PointShop;
