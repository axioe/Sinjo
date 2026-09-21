import { useState, useEffect } from "react";
import {
  getPointShopItems,
  createPointShopItem,
  updatePointShopItem,
  deletePointShopItem,
} from "../../api/adminApi";

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
  icon: "",
};

/**
 * 포인트 상점 관리 (REQ-ADM-01, REQ-MY-01)
 * PointService.SHOP_ITEMS 고정 Map 을 대체한다 - 여기서 등록/수정/삭제한 값이
 * 그대로 /mypage/point-shop 상점 목록·가격·설명·아이콘에 반영된다.
 *
 * 색상 테마는 PointShop.jsx 가 상품 id 로 순환 결정하는 화면 전용 값이라 여기서는
 * 다루지 않는다.
 */
function AdminPointShop() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getPointShopItems()
      .then(setItems)
      .catch((err) => setErrors({ form: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const validate = () => {
    const found = {};

    if (!form.name.trim()) {
      found.name = "상품명을 입력해 주세요.";
    }

    const price = Number(form.price);
    if (!form.price || !Number.isInteger(price) || price <= 0) {
      found.price = "가격은 1 이상의 정수로 입력해 주세요.";
    }

    return found;
  };

  const toPayload = () => ({
    name: form.name.trim(),
    price: Number(form.price),
    description: form.description.trim() || null,
    icon: form.icon.trim() || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      if (editingId) {
        await updatePointShopItem(editingId, toPayload());
      } else {
        await createPointShopItem(toPayload());
      }
      resetForm();
      load();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description ?? "",
      icon: item.icon ?? "",
    });

    setErrors({});

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (item) => {
    if (
      !window.confirm(
        `'${item.name}' 상품을 삭제할까요?\n이미 구매한 회원의 구매 기록은 그대로 남습니다.`,
      )
    )
      return;

    try {
      await deletePointShopItem(item.id);
      // 수정 중이던 항목을 지웠다면 폼도 비운다.
      if (editingId === item.id) resetForm();
      load();
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  return (
    <>
      <h1 className="admin-title">포인트 상점 관리</h1>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <p className="admin-form-title">
          {editingId ? "상품 수정" : "상품 등록"}
        </p>

        {errors.form && <p className="admin-alert">{errors.form}</p>}

        <div className="admin-field">
          <label htmlFor="point-shop-name">상품명</label>
          <input
            id="point-shop-name"
            value={form.name}
            onChange={setField("name")}
            placeholder="예: 프로필 테마"
          />
          {errors.name && <p className="admin-field-error">{errors.name}</p>}
        </div>

        <div className="admin-field">
          <label htmlFor="point-shop-price">가격 (P)</label>
          <input
            id="point-shop-price"
            type="number"
            min="1"
            step="1"
            value={form.price}
            onChange={setField("price")}
            placeholder="예: 300"
          />
          {errors.price && (
            <p className="admin-field-error">{errors.price}</p>
          )}
        </div>

        <div className="admin-field">
          <label htmlFor="point-shop-icon">아이콘 (이모지, 선택)</label>
          <input
            id="point-shop-icon"
            value={form.icon}
            onChange={setField("icon")}
            placeholder="예: 🎁"
            maxLength={8}
          />
          {errors.icon && <p className="admin-field-error">{errors.icon}</p>}
        </div>

        <div className="admin-field">
          <label htmlFor="point-shop-description">설명 (선택)</label>
          <textarea
            id="point-shop-description"
            value={form.description}
            onChange={setField("description")}
            placeholder="예: 마이페이지 프로필을 나만의 분위기로 꾸밀 수 있어요."
            maxLength={300}
            rows={3}
          />
          {errors.description && (
            <p className="admin-field-error">{errors.description}</p>
          )}
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            className="admin-btn primary"
            disabled={submitting}
          >
            {submitting ? "처리 중..." : editingId ? "수정하기" : "등록하기"}
          </button>

          {editingId && (
            <button type="button" className="admin-btn" onClick={resetForm}>
              취소
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="admin-loading">불러오는 중...</p>
      ) : (
        <>
          <p className="admin-desc">전체 {items.length}개</p>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th></th>
                  <th>상품명</th>
                  <th>설명</th>
                  <th>가격</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={editingId === item.id ? "editing" : ""}
                  >
                    <td>{item.id}</td>

                    <td aria-hidden="true">{item.icon || "🎁"}</td>

                    <td className="admin-td-word">
                      <button
                        type="button"
                        className="admin-td-word-btn"
                        onClick={() => handleEdit(item)}
                      >
                        {item.name}
                      </button>
                    </td>

                    <td className="admin-td-wrap admin-td-example">
                      {item.description || "—"}
                    </td>

                    <td>{item.price.toLocaleString()}P</td>

                    <td className="admin-td-actions">
                      <button
                        type="button"
                        className="admin-btn small danger"
                        onClick={() => handleDelete(item)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default AdminPointShop;
