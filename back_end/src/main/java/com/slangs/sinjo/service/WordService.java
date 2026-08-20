package com.slangs.sinjo.service;

import com.slangs.sinjo.document.WordDocumentConverter;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordRequest;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class WordService {

    private final WordRepository wordRepository;
    private final VectorStore vectorStore;
    private final WordDocumentConverter documentConverter;

    /**
     * 전체 신조어 조회
     */
    @Transactional(readOnly = true)
    public List<WordDto> getAllWords() {
        return wordRepository.findAll()
                .stream()
                .map(WordDto::new)
                .toList();
    }

    /**
     * 특정 신조어 조회
     * 상세 페이지에 들어갈 때마다 조회수 +1
     */
    @Transactional
    public WordDto getWord(Long id) {

        int updated = wordRepository.increaseView(id);

        if (updated == 0) {
            throw new NotFoundException(
                    "신조어를 찾을 수 없습니다."
            );
        }

        Word word = findWordOrThrow(id);

        return new WordDto(word);
    }

    /**
     * 좋아요 증가
     */
    @Transactional
    public WordDto likeWord(Long id) {

        int updated = wordRepository.increaseLike(id);

        if (updated == 0) {
            throw new NotFoundException(
                    "신조어를 찾을 수 없습니다."
            );
        }

        return new WordDto(findWordOrThrow(id));
    }

    /**
     * 좋아요 기준 TOP 5
     */
    @Transactional(readOnly = true)
    public List<WordDto> getRankingWords() {

        List<Word> words =
                wordRepository.findTop5ByOrderByLikesDescIdAsc();

        return IntStream
                .range(0, words.size())
                .mapToObj(index ->
                        new WordDto(
                                words.get(index),
                                index + 1
                        )
                )
                .toList();
    }

    /**
     * 신조어 생성
     */
    @Transactional
    public WordDto create(WordRequest request) {

        Word word = new Word(
                request.word(),
                request.meaning(),
                request.example(),
                request.category(),
                request.era()
        );

        Word savedWord = wordRepository.save(word);

        Document document =
                documentConverter.convert(savedWord);

        vectorStore.add(
                List.of(document)
        );

        return new WordDto(savedWord);
    }

    /**
     * 신조어 삭제
     */
    @Transactional
    public void delete(Long wordId) {

        Word word = wordRepository.findById(wordId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어를 찾을 수 없습니다."
                        )
                );

        wordRepository.delete(word);

        // DB 삭제 후 VectorStore에서도 삭제
        deleteVector(wordId);
    }

    /**
     * VectorStore에서 해당 단어 삭제
     */
    private void deleteVector(Long wordId) {

        FilterExpressionBuilder builder =
                new FilterExpressionBuilder();

        vectorStore.delete(
                builder
                        .eq("wordId", String.valueOf(wordId))
                        .build()
        );
    }

    /**
     * 신조어 수정
     */
    @Transactional
    public WordDto update(
            Long wordId,
            WordRequest request
    ) {

        Word word = wordRepository.findById(wordId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어를 찾을 수 없습니다."
                        )
                );

        // DB 데이터 수정
        word.update(
                request.word(),
                request.meaning(),
                request.example(),
                request.category(),
                request.era()
        );

        Word updatedWord =
                wordRepository.save(word);

        // 기존 Vector 삭제
        deleteVector(wordId);

        // 수정된 데이터로 새로운 Document 생성
        Document document =
                documentConverter.convert(updatedWord);

        // 새로운 embedding 생성 후 저장
        vectorStore.add(
                List.of(document)
        );

        return new WordDto(updatedWord);
    }

    /**
     * ID로 Word 조회
     */
    private Word findWordOrThrow(Long id) {

        return wordRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어를 찾을 수 없습니다."
                        )
                );
    }
}
