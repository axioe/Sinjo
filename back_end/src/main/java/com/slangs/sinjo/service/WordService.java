package com.slangs.sinjo.service;

import com.slangs.sinjo.document.WordDocumentConverter;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordRequest;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.entity.WordLike;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordLikeRepository;
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
    private final WordLikeRepository wordLikeRepository;
    private final UserRepository userRepository;

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
     * 좋아요 추가.
     * <p>
     * 동일 사용자가 동일 신조어에 여러 번 요청해도
     * 좋아요는 최초 1회만 증가한다.
     * <p>
     * 동시 요청까지 안전하게 처리하기 위해
     * Word 행을 PESSIMISTIC_WRITE로 잠근다.
     */
    @Transactional
    public WordDto likeWord(
            Long wordId,
            Long userId
    ) {

        if (userId == null) {
            throw new IllegalStateException(
                    "로그인이 필요한 기능입니다."
            );
        }

        /*
         * Word 행을 먼저 잠근다.
         *
         * 같은 단어에 동시에 좋아요 요청이 들어오면
         * 한 요청씩 순서대로 처리된다.
         */
        Word word = wordRepository.findByIdForLike(wordId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어를 찾을 수 없습니다."
                        )
                );

        /*
         * 좋아요를 누른 사용자 확인
         */
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "사용자를 찾을 수 없습니다."
                        )
                );

        /*
         * 이미 좋아요를 눌렀다면
         *
         * 아무것도 추가하지 않고
         * 현재 단어 정보를 그대로 반환한다.
         *
         * 따라서 같은 API를 여러 번 호출해도
         * likes가 중복 증가하지 않는다.
         */
        boolean alreadyLiked =
                wordLikeRepository.existsByWordIdAndUserId(
                        wordId,
                        userId
                );

        if (!alreadyLiked) {

            /*
             * 사용자-단어 좋아요 기록 생성
             */
            WordLike wordLike = new WordLike(
                    word,
                    user
            );

            wordLikeRepository.save(wordLike);

            /*
             * Word의 집계 좋아요 수 증가
             */
            word.increaseLike();
        }

        return new WordDto(word);
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

        /*
         * WordLike가 Word를 FK로 참조하고 있으므로
         * Word를 삭제하기 전에 좋아요 기록을 먼저 삭제한다.
         */
        wordLikeRepository.deleteAllByWordId(wordId);

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

    public List<String> findCategories() {
        return wordRepository.findCategories();
    }

    /**
     * 관리자 승인으로 후보 신조어를 실제 Word로 등록
     * <p>
     * Word 생성 후 VectorStore에도 embedding을 저장한다.
     */
    @Transactional
    public WordDto createFromProposal(
            String word,
            String meaning,
            String example,
            String category,
            String era
    ) {

        Word target = new Word(
                word,
                meaning,
                example,
                category,
                era
        );

        Word savedWord = wordRepository.save(target);

        Document document =
                documentConverter.convert(savedWord);

        vectorStore.add(
                List.of(document)
        );

        return new WordDto(savedWord);
    }
}
