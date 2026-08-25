package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QuizQuestion;
import com.slangs.sinjo.dto.QuizResponse;
import com.slangs.sinjo.entity.LearningHistory;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.LearningHistoryRepository;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiLearningService {

    private final WordRepository wordRepository;
    private final LearningHistoryRepository learningHistoryRepository;

    private static final int QUIZ_SIZE = 5;
    private static final int OPTION_SIZE = 4;


    /**
     * 오늘 학습할 문제 생성
     *
     * 이미 학습 완료한 문제는 제외한다.
     * 모든 신조어를 한 번씩 학습하면
     * 새로운 학습 사이클을 시작한다.
     */
    public QuizResponse createTodayQuiz(Long userId) {

        List<Word> allWords =
                new ArrayList<>(wordRepository.findAll());

        if (allWords.size() < OPTION_SIZE) {
            return new QuizResponse(
                    Collections.emptyList()
            );
        }

        // 로그인 사용자만 학습 이력 적용
        Set<Long> learnedWordIds =
                userId == null
                        ? Collections.emptySet()
                        : learningHistoryRepository
                          .findByUserId(userId)
                          .stream()
                          .map(LearningHistory::getWordId)
                          .collect(Collectors.toSet());

        List<Word> unlearnedWords =
                allWords.stream()
                        .filter(word ->
                                !learnedWordIds.contains(
                                        word.getId()
                                )
                        )
                        .collect(Collectors.toList());

        // 로그인 사용자가 모든 문제를 학습한 경우
        if (userId != null
                && unlearnedWords.isEmpty()) {

            learningHistoryRepository
                    .deleteByUserId(userId);

            unlearnedWords =
                    new ArrayList<>(allWords);
        }

        Collections.shuffle(unlearnedWords);

        List<Word> selectedWords =
                unlearnedWords.stream()
                        .limit(
                                Math.min(
                                        QUIZ_SIZE,
                                        unlearnedWords.size()
                                )
                        )
                        .collect(Collectors.toList());

        List<QuizQuestion> questions =
                selectedWords.stream()
                        .map(word ->
                                createQuestion(
                                        word,
                                        allWords
                                )
                        )
                        .collect(Collectors.toList());

        return new QuizResponse(questions);
    }

    /**
     * 하나의 퀴즈 문제 생성
     */
    private QuizQuestion createQuestion(
            Word word,
            List<Word> allWords
    ) {

        List<String> options =
                createOptions(word, allWords);

        // 정답 위치 랜덤
        Collections.shuffle(options);

        int answer =
                options.indexOf(
                        word.getMeaning()
                );

        return new QuizQuestion(
                word.getId(),
                word.getWord(),
                "'" + word.getWord() + "'의 뜻은 무엇일까요?",
                options,
                answer,
                createExplanation(word)
        );
    }


    /**
     * 선택지 생성
     */
    private List<String> createOptions(
            Word answerWord,
            List<Word> allWords
    ) {

        List<String> options =
                new ArrayList<>();

        // 정답
        options.add(answerWord.getMeaning());


        /*
         * 오답 후보
         */
        List<Word> candidates =
                allWords.stream()
                        .filter(word ->
                                !word.getId()
                                        .equals(answerWord.getId())
                        )
                        .filter(word ->
                                word.getMeaning() != null
                        )
                        .filter(word ->
                                !word.getMeaning()
                                        .equals(
                                                answerWord.getMeaning()
                                        )
                        )
                        .collect(Collectors.toList());


        Collections.shuffle(candidates);


        candidates.stream()
                .map(Word::getMeaning)
                .limit(OPTION_SIZE - 1)
                .forEach(options::add);


        /*
         * 데이터 부족 안전장치
         */
        while (options.size() < OPTION_SIZE) {

            String fallback =
                    "다른 의미로 사용되는 표현입니다.";

            if (!options.contains(fallback)) {
                options.add(fallback);
            } else {
                options.add(
                        "특정 상황에서 사용하는 표현입니다."
                );
            }
        }


        return options;
    }


    /**
     * 학습 완료 처리
     */
    public void completeLearning(
            Long userId,
            List<Long> wordIds
    ) {

        if (wordIds == null || wordIds.isEmpty()) {
            return;
        }


        for (Long wordId : wordIds) {

            if (wordId == null) {
                continue;
            }


            /*
             * 이미 저장된 학습 기록은 중복 저장하지 않는다.
             */
            if (!learningHistoryRepository
                    .existsByUserIdAndWordId(
                            userId,
                            wordId
                    )) {

                learningHistoryRepository.save(
                        new LearningHistory(
                                userId,
                                wordId
                        )
                );
            }
        }
    }


    /**
     * 해설 생성
     */
    private String createExplanation(
            Word word
    ) {

        return "'" +
                word.getWord() +
                "'는 " +
                word.getMeaning() +
                "라는 뜻으로 사용됩니다.";
    }
}