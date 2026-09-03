import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCoins, FaShoppingBag, FaCheck } from "react-icons/fa";

import "../../css/mypage/PointShop.css";
import { getMyPoints, getShopItems, purchaseItem } from "../../api/pointApi";

/**
 * 상점 아이템의 아이콘/설명/색상 - 화면 전용 정보라 서버에는 없다(id/name/price 만 옴).
 * 관리자 페이지(AdminPointShop)에서 등록한 초기 4개 상품의 id 와 맞춰 둔 값이다.
 * 관리자가 새 상품을 추가하면 이 매핑에 없는 id 가 들어올 수 있어 DEFAULT_PRESENTATION 으로
 * 대체한다 - 새 상품 전용 아이콘/설명이 필요해지면 여기 항목을 추가하면 된다.
 */
const DEFAULT_PRESENTATION = {
  icon: "🎁",
  description: "포인트로 교환할 수 있는 아이템이에요.",
  color: "purple",
};

const PRESENTATION = {
  1: {
    icon: "🎨",
    description: "마이페이지 프로필을 나만의 분위기로 꾸밀 수 있어요.",
    color: "purple",
  },
  2: {
    icon: "🏷️",
    description: "프로필에 특별한 닉네임 뱃지를 표시할 수 있어요.",
    color: "blue",
  },
  3: {
    icon: "✨",
    description: "프로필에 특별한 반짝임 효과를 추가할 수 있어요.",
    color: "yellow",
  },
  4: {
    icon: "👑",
    description: "특별한 VIP 뱃지로 프로필을 꾸밀 수 있어요.",
    color: "pink",
  },
};

function PointShop() {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [points, shop] = await Promise.all([
          getMyPoints(),
          getShopItems(),
        ]);

        if (!alive) return;

        setBalance(points?.balance ?? 0);
        setItems(shop?.items ?? []);
        setPurchasedIds(shop?.purchasedItemIds ?? []);
      } catch (error) {
        console.error("포인트 상점 조회 실패:", error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const handlePurchase = async (item) => {
    if (balance < item.price) {
      window.alert(
        `포인트가 부족합니다.\n\n현재 포인트: ${balance.toLocaleString()}P`,
      );

      return;
    }

    const confirmed = window.confirm(
      `${item.name}을(를) 구매하시겠습니까?\n\n` +
        `가격: ${item.price.toLocaleString()}P\n` +
        `현재 포인트: ${balance.toLocaleString()}P`,
    );

    if (!confirmed) {
      return;
    }

    setPurchasingId(item.id);

    try {
      const result = await purchaseItem(item.id);

      setBalance(result.balance);
      setPurchasedIds((prev) => [...prev, item.id]);
    } catch (error) {
      window.alert(error.message ?? "구매에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <main className="point-shop-page">
        <p className="point-shop-loading">포인트 상점을 불러오는 중...</p>
      </main>
    );
  }

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
              {balance.toLocaleString()}
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

          <div className="point-shop-count">{items.length} ITEMS</div>
        </div>

        <div className="point-shop-grid">
          {items.map((item) => {
            const { icon, description, color } =
              PRESENTATION[item.id] ?? DEFAULT_PRESENTATION;
            const canPurchase = balance >= item.price;
            const purchased = purchasedIds.includes(item.id);
            const purchasing = purchasingId === item.id;

            return (
              <article
                key={item.id}
                className={`point-shop-item ${color ?? ""}`}
              >
                <div className="point-shop-item-bg" aria-hidden="true" />

                <div className="point-shop-item-top">
                  <div className="point-shop-item-icon" aria-hidden="true">
                    {icon}
                  </div>

                  <span className="point-shop-item-tag">ITEM</span>
                </div>

                <div className="point-shop-item-content">
                  <h3>{item.name}</h3>

                  <p>{description}</p>
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
                    disabled={!canPurchase || purchased || purchasing}
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
                        {purchasing
                          ? "구매 중..."
                          : canPurchase
                            ? "구매하기"
                            : "포인트 부족"}
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
