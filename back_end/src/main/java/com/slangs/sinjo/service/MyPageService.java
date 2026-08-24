package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.entity.Translations;
import com.slangs.sinjo.repository.TranslationsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageService {

    private final TranslationsRepository translationsRepository;

    public List<TranslationDto> getHistory(Long userId, int page, int size) {
        Page<Translations> result = translationsRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        return result.getContent().stream()
                .map(TranslationDto::from)
                .toList();
    }
}