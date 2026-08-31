package com.slangs.sinjo.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 이 클래스가 없으면 모든 예외가 500 으로 나가고
 * 프론트는 "회원가입 실패" 외에 아무 정보도 받지 못한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ErrorResponse(String message, Map<String, String> fieldErrors) {
        static ErrorResponse of(String message) {
            return new ErrorResponse(message, Map.of());
        }
    }

    /** @Valid 검증 실패 → 필드별 메시지를 내려 입력창 아래에 붙일 수 있게 한다. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : e.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("입력값을 확인해 주세요.", fieldErrors));
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(e.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(e.getMessage()));
    }

    /** [추가] 토큰이 없거나 만료된 경우. 프론트는 이 401 을 받으면 로그인 화면으로 보낸다. */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(e.getMessage()));
    }

    /** [추가] 관리자 화면에서 신조어를 중복 등록하려 한 경우 */
    @ExceptionHandler(DuplicateWordException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateWord(DuplicateWordException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(e.getMessage()));
    }

    /** [추가] 없는 자원을 수정·삭제하려 한 경우 */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(e.getMessage()));
    }

    /** [추가] Whisper 호출 실패. 우리 쪽 잘못이 아니라 외부 API 문제라 502 로 구분한다. */
    @ExceptionHandler(SttTranscriptionException.class)
    public ResponseEntity<ErrorResponse> handleSttTranscription(SttTranscriptionException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ErrorResponse.of(e.getMessage()));
    }

    /**
     * [추가] DB 제약 위반을 잡아 500 대신 409 로 내려준다.
     *
     * QuizWord.word 의 unique 제약(애플리케이션 레벨 검사)은 없앴지만, 지금 DB 에는
     * 같은 컬럼에 다른 팀원이 작업 중이라 아직 못 지운 유니크 인덱스가 남아 있다.
     * 그 인덱스가 남아있는 동안에는 여기서 걸리고, 나중에 정리되면 이 핸들러는
     * 그냥 안 쓰이게 될 뿐 코드를 다시 고칠 필요는 없다.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of("이미 등록된 값이거나 처리할 수 없는 요청입니다."));
    }
}
