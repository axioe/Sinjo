package com.slangs.sinjo.exception;

/** Whisper 호출이 실패했거나(네트워크, 인증 등) 빈 오디오가 들어온 경우 던진다. */
public class SttTranscriptionException extends RuntimeException {
    public SttTranscriptionException(String message) {
        super(message);
    }

    public SttTranscriptionException(String message, Throwable cause) {
        super(message, cause);
    }
}
