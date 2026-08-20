import { createContext, useContext } from "react";

/**
 * 컴포넌트가 아닌 것(컨텍스트·훅)은 별도 파일로 뺀다.
 * 한 파일에서 컴포넌트와 훅을 함께 내보내면
 * 저장할 때마다 화면 상태가 초기화되는(Fast Refresh 실패) 문제가 생긴다.
 */
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
