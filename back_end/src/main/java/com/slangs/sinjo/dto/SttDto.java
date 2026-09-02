package com.slangs.sinjo.dto;

/** 음성 인식(STT) - 번역 화면의 마이크 버튼용 (REQ-TR-STT). */
public class SttDto {

    /** Whisper 가 돌려준 인식 텍스트. 프론트는 이 값을 번역 입력창에 채워 넣기만 한다. */
    public record TranscriptionResponse(String text) {}
}
