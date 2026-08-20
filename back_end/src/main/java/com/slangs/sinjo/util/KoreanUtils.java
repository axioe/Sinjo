package com.slangs.sinjo.util;

public class KoreanUtils {

    private static final char[] INITIAL_SOUNDS = {
            'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
            'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    };

    // 완성형 한글 단어를 초성 스트링으로 변환
    public static String extractInitialSound(String text) {
        if (text == null) return "";

        StringBuilder sb = new StringBuilder();
        for (char ch : text.toCharArray()) {
            if (ch >= 0xAC00 && ch <= 0xD7A3) { // 한글 음절 범위
                int index = (ch - 0xAC00) / (21 * 28);
                sb.append(INITIAL_SOUNDS[index]);
            } else {
                sb.append(ch); // 한글이 아닌 문자는 그대로 유지
            }
        }
        return sb.toString();
    }
}