package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.SttDto;
import com.slangs.sinjo.service.SttService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** 번역 화면의 마이크 버튼용 음성 인식 API (REQ-TR-STT). */
@RestController
@RequestMapping("/api/stt")
@RequiredArgsConstructor
public class SttController {

    private final SttService sttService;

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SttDto.TranscriptionResponse> transcribe(@RequestParam("audio") MultipartFile audio) {
        return ResponseEntity.ok(sttService.transcribe(audio));
    }
}
