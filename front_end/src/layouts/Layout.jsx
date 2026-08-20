import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

/**
 * 모든 페이지가 공유하는 껍데기.
 * 기존에는 페이지마다 <Header /> 를 직접 넣어서, 헤더를 고치려면
 * 여덟 파일을 다 고쳐야 했다. 여기로 모았다.
 * Outlet 자리에 현재 주소에 맞는 페이지가 들어온다.
 */
function Layout() {
  return (
    <>
      <Header />
      <main className="page-container">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default Layout;
