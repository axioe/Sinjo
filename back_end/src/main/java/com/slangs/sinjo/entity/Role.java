package com.slangs.sinjo.entity;

public enum Role {
    USER,
    ADMIN;

    /**
     * Spring Security 의 hasRole("ADMIN") 은 실제로 "ROLE_ADMIN" 권한을 찾는다.
     * 접두어를 빠뜨리면 관리자 API 가 계속 403 을 반환한다.
     */
    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
