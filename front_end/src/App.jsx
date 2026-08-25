import { Routes, Route } from "react-router-dom";

import Layout from "./layouts/Layout";
import RequireAuth from "./components/guards/RequireAuth";
import RequireAdmin from "./components/guards/RequireAdmin";

import Main from "./pages/Main";
import Translate from "./pages/dictionary/Translate";
import Dictionary from "./pages/dictionary/Dictionary";
import Ranking from "./pages/dictionary/Ranking";
import TodayWord from "./pages/dictionary/TodayWord";
import Test from "./pages/Test";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import MyPage from "./pages/mypage/MyPage";
import AdminPage from "./pages/Admin/AdminPage";
import NotFound from "./pages/NotFound";
import WordDetail from "./pages/dictionary/WordDetail";
// 비밀번호 찾기 페이지 라우팅
import FindPassword from "./pages/auth/FindPassword";
// 비밀번호 재설정
import ResetPassword from "./pages/auth/ResetPassword";
// 네이버 소셜 로그인
import OAuthCallback from "./pages/auth/OAuthCallback";

import QuizMain from "./pages/game/QuizMain";
import MultipleChoiceQuiz from "./pages/game/MultipleChoiceQuiz";
import InitialSoundQuiz from "./pages/game/InitialSoundQuiz";
import SubjectiveQuiz from "./pages/game/SubjectiveQuiz";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 메인 */}
        <Route path="/" element={<Main />} />

        {/* 번역 */}
        <Route path="/translate" element={<Translate />} />

        {/* 신조어 사전 */}
        <Route path="/dictionary" element={<Dictionary />} />

        {/* 신조어 상세 */}
        <Route path="/dictionary/:id" element={<WordDetail />} />

        {/* 랭킹 */}
        <Route path="/ranking" element={<Ranking />} />

        {/* 오늘의 단어 */}
        <Route path="/today" element={<TodayWord />} />

        {/* 테스트 */}
        <Route path="/test" element={<Test />} />

        {/* 로그인 / 회원가입 */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 마이페이지 */}
        <Route
          path="/mypage"
          element={
            <RequireAuth>
              <MyPage />
            </RequireAuth>
          }
        />
        {/* 비밀번호 찾기 */}
        <Route path="/find-password" element={<FindPassword />} />
        {/* 비밀번호 재설정 */}
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* 네이버 소셜 로그인 */}
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* 관리자 */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />

        {/* 퀴즈 */}
        <Route path="/game" element={<QuizMain />} />
        <Route path="/game/multiple" element={<MultipleChoiceQuiz />} />
        <Route path="/game/initial" element={<InitialSoundQuiz />} />
        <Route path="/game/subjective" element={<SubjectiveQuiz />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
