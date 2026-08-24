package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QuizQuestion;
import com.slangs.sinjo.dto.QuizResponse;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiLearningService {

    private final WordRepository wordRepository;

    private static final int QUIZ_SIZE = 5;
    private static final int OPTION_SIZE = 4;

    public QuizResponse createTodayQuiz() {

        List<Word> words = new ArrayList<>(
                wordRepository.findAll()
        );

        // 문제가 부족한 경우
        if (words.size() < OPTION_SIZE) {
            return new QuizResponse(
                    Collections.emptyList()
            );
        }

        // 전체 신조어를 랜덤하게 섞음
        Collections.shuffle(words);

        // 오늘 출제할 문제 5개
        List<Word> selectedWords =
                words.stream()
                        .limit(Math.min(QUIZ_SIZE, words.size()))
                        .toList();

        List<QuizQuestion> questions =
                selectedWords.stream()
                        .map(word -> createQuestion(word, words))
                        .toList();

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

        // 정답 위치를 랜덤하게 변경
        Collections.shuffle(options);

        int answer =
                options.indexOf(word.getMeaning());

        return new QuizQuestion(
                word.getWord(),
                "'" + word.getWord() + "'의 뜻은 무엇일까요?",
                options,
                answer,
                createExplanation(word)
        );
    }


    /**
     * 선택지 생성
     *
     * 정답 1개
     * 오답 3개
     */
    private List<String> createOptions(
            Word answerWord,
            List<Word> allWords
    ) {

        List<String> options =
                new ArrayList<>();

        // 정답 추가
        options.add(answerWord.getMeaning());

        // 다른 단어의 뜻을 오답으로 사용
        List<Word> candidates =
                allWords.stream()
                        .filter(word ->
                                !word.getWord()
                                        .equals(answerWord.getWord())
                        )
                        .filter(word ->
                                word.getMeaning() != null
                        )
                        .filter(word ->
                                !word.getMeaning()
                                        .equals(answerWord.getMeaning())
                        )
                        .collect(
                                java.util.stream.Collectors.toList()
                        );

        Collections.shuffle(candidates);

        candidates.stream()
                .map(Word::getMeaning)
                .limit(OPTION_SIZE - 1)
                .forEach(options::add);

        /*
         * 데이터가 부족한 경우를 위한
         * 안전장치
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
     * 해설 생성
     */
    private String createExplanation(Word word) {

        return "'" +
                word.getWord() +
                "'는 " +
                word.getMeaning() +
                "라는 뜻으로 사용됩니다.";
    }
}