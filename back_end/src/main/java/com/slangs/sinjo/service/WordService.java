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
     * <p>
     * 상세 페이지 진입 시 조회수 +1
     */
    @Transactional
    public WordDto getWord(Long id) {

        int updated =
                wordRepository.increaseView(id);

        if (updated == 0) {
            throw new NotFoundException(
                    "신조어를 찾을 수 없습니다."
            );
        }

        Word word =
                findWordOrThrow(id);

        return new WordDto(word);
    }

    /**
     * 좋아요 추가
     * <p>
     * 같은 사용자가 같은 단어에 여러 번 요청해도
     * 실제 좋아요는 한 번만 저장된다.
     * <p>
     * 동시 요청에 대비하여 Word 행을 비관적 락으로 잠근다.
     * <p>
     * 또한 DB의 UNIQUE(user_id, word_id) 제약을 사용한다.
     */
    @Transactional
    public WordDto likeWord(
            Long wordId,
            Long userId
    ) {

        requireUser(userId);

        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "사용자를 찾을 수 없습니다."
                                )
                        );

        /*
         * 단어 행을 잠근다.
         *
         * 같은 단어에 동시에 좋아요 요청이 들어와도
         * 아래 중복 검사와 좋아요 증가가 순차적으로 처리된다.
         */
        Word word =
                wordRepository.findByIdForUpdate(wordId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "신조어를 찾을 수 없습니다."
                                )
                        );

        /*
         * 이미 좋아요했는지 확인
         */
        boolean alreadyLiked =
                wordLikeRepository
                        .existsByUser_IdAndWord_Id(
                                userId,
                                wordId
                        );

        /*
         * 이미 좋아요했다면 아무것도 하지 않는다.
         *
         * 따라서 POST를 여러 번 보내도
         * likes가 계속 증가하지 않는다.
         */
        if (!alreadyLiked) {

            WordLike wordLike =
                    new WordLike(
                            user,
                            word
                    );

            wordLikeRepository.save(wordLike);

            wordRepository.increaseLike(wordId);
        }

        /*
         * increaseLike()가 DB UPDATE 쿼리이므로
         * 변경된 Word를 다시 조회한다.
         */
        Word updatedWord =
                findWordOrThrow(wordId);

        return new WordDto(updatedWord);
    }

    /**
     * 좋아요 취소
     */
    @Transactional
    public WordDto unlikeWord(
            Long wordId,
            Long userId
    ) {

        requireUser(userId);

        /*
         * 단어가 존재하는지 확인하면서
         * 동시에 해당 Word 행을 잠근다.
         */
        Word word =
                wordRepository.findByIdForUpdate(wordId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "신조어를 찾을 수 없습니다."
                                )
                        );

        /*
         * 해당 사용자의 좋아요가 있는지 확인
         */
        boolean alreadyLiked =
                wordLikeRepository
                        .existsByUser_IdAndWord_Id(
                                userId,
                                wordId
                        );

        /*
         * 좋아요가 있을 때만 삭제하고
         * likes를 감소시킨다.
         */
        if (alreadyLiked) {

            wordLikeRepository
                    .deleteByUser_IdAndWord_Id(
                            userId,
                            wordId
                    );

            wordRepository.decreaseLike(wordId);
        }

        Word updatedWord =
                findWordOrThrow(wordId);

        return new WordDto(updatedWord);
    }

    /**
     * 현재 로그인 사용자가 좋아요한 단어 ID 목록
     */
    @Transactional(readOnly = true)
    public List<Long> getLikedWordIds(
            Long userId
    ) {

        requireUser(userId);

        return wordLikeRepository
                .findAllByUser_Id(userId)
                .stream()
                .map(wordLike ->
                        wordLike.getWord().getId()
                )
                .toList();
    }

    /**
     * 좋아요 기준 TOP 5
     */
    @Transactional(readOnly = true)
    public List<WordDto> getRankingWords() {

        List<Word> words =
                wordRepository
                        .findTop5ByOrderByLikesDescIdAsc();

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
    public WordDto create(
            WordRequest request
    ) {

        Word word =
                new Word(
                        request.word(),
                        request.meaning(),
                        request.example(),
                        request.category(),
                        request.era()
                );

        Word savedWord =
                wordRepository.save(word);

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

        Word word =
                wordRepository.findById(wordId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "신조어를 찾을 수 없습니다."
                                )
                        );

        /*
         * WordLike가 Word를 참조하므로
         * 먼저 좋아요 기록을 삭제한다.
         */
        wordLikeRepository
                .deleteAllByWord_Id(wordId);

        /*
         * Word 삭제
         */
        wordRepository.delete(word);

        /*
         * VectorStore에서도 삭제
         */
        deleteVector(wordId);
    }

    /**
     * VectorStore에서 해당 단어 삭제
     */
    private void deleteVector(
            Long wordId
    ) {

        FilterExpressionBuilder builder =
                new FilterExpressionBuilder();

        vectorStore.delete(
                builder
                        .eq(
                                "wordId",
                                String.valueOf(wordId)
                        )
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

        Word word =
                wordRepository.findById(wordId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "신조어를 찾을 수 없습니다."
                                )
                        );

        word.update(
                request.word(),
                request.meaning(),
                request.example(),
                request.category(),
                request.era()
        );

        Word updatedWord =
                wordRepository.save(word);

        deleteVector(wordId);

        Document document =
                documentConverter.convert(updatedWord);

        vectorStore.add(
                List.of(document)
        );

        return new WordDto(updatedWord);
    }

    /**
     * 관리자 승인으로 후보 신조어를 실제 Word로 등록
     */
    @Transactional
    public WordDto createFromProposal(
            String word,
            String meaning,
            String example,
            String category,
            String era
    ) {

        Word target =
                new Word(
                        word,
                        meaning,
                        example,
                        category,
                        era
                );

        Word savedWord =
                wordRepository.save(target);

        Document document =
                documentConverter.convert(savedWord);

        vectorStore.add(
                List.of(document)
        );

        return new WordDto(savedWord);
    }

    /**
     * ID로 Word 조회
     */
    private Word findWordOrThrow(
            Long id
    ) {

        return wordRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어를 찾을 수 없습니다."
                        )
                );
    }

    /**
     * 로그인 여부 확인
     */
    private void requireUser(
            Long userId
    ) {

        if (userId == null) {
            throw new IllegalStateException(
                    "로그인이 필요한 기능입니다."
            );
        }
    }

    /**
     * 카테고리 목록
     */
    @Transactional(readOnly = true)
    public List<String> findCategories() {
        return wordRepository.findCategories();
    }
}
