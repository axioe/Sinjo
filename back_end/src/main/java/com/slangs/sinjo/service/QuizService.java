package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QuizDto;
import com.slangs.sinjo.entity.QuizWord;
import com.slangs.sinjo.repository.QuizRepository;
import com.slangs.sinjo.util.KoreanUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

    private final QuizRepository quizRepository;
    private static final int DEFAULT_QUIZ_COUNT = 5;

    // 1. 객관식 퀴즈 목록 생성
    public List<QuizDto.MultipleChoice> getMultipleChoiceQuizzes() {
        List<QuizWord> randomWords = findRandomQuizzes(DEFAULT_QUIZ_COUNT);

        return randomWords.stream().map(quiz -> {
            List<String> options = new ArrayList<>(
                    quiz.getOptions() == null ? List.of() : quiz.getOptions());

            // [수정] DB 의 options 에 이미 정답이 들어 있는 경우가 있다.
            // 그대로 add 하면 같은 보기가 두 번 나오고,
            // 프론트가 key={option} 을 쓰기 때문에 React key 중복 경고까지 난다.
            String answer = quiz.getAnswer();
            boolean alreadyHasAnswer = options.stream()
                    .anyMatch(o -> normalize(o).equals(normalize(answer)));
            if (!alreadyHasAnswer) {
                options.add(answer);
            }

            Collections.shuffle(options); // 보기 순서 랜덤 섞기

            return new QuizDto.MultipleChoice(
                    quiz.getId(),
                    quiz.getWord(),
                    options,
                    quiz.getDescription()
            );
        }).toList();
    }

    // 2. 초성 퀴즈 목록 생성
    public List<QuizDto.InitialSound> getInitialSoundQuizzes() {
        List<QuizWord> randomWords = findRandomQuizzes(DEFAULT_QUIZ_COUNT);

        return randomWords.stream().map(quiz -> {
            String initialSound = KoreanUtils.extractInitialSound(quiz.getWord());
            return new QuizDto.InitialSound(
                    quiz.getId(),
                    initialSound,
                    // [수정] description 이 비어 있는 행이 있어 힌트가 아예 안 보였다.
                    // 그럴 때는 뜻(answer)을 힌트로 쓴다.
                    quiz.getDescription() != null && !quiz.getDescription().isBlank()
                            ? quiz.getDescription()
                            : quiz.getAnswer()
            );
        }).toList();
    }

    // 3. 주관식 퀴즈 목록 생성
    public List<QuizDto.Subjective> getSubjectiveQuizzes() {
        List<QuizWord> randomWords = findRandomQuizzes(DEFAULT_QUIZ_COUNT);

        return randomWords.stream().map(quiz -> new QuizDto.Subjective(
                quiz.getId(),
                "다음 뜻에 해당하는 신조어는?: " + quiz.getAnswer(),
                quiz.getDescription()
        )).toList();
    }

    /**
     * 4. 정답 확인 및 채점
     *
     * [수정 1] request.answer() 가 null 이면 NPE 로 500 이 났다. normalize 에서 방어한다.
     * [수정 2] 퀴즈 종류별로 채점 기준을 나눴다.
     *          기존에는 "뜻" 과 "단어" 중 아무거나 맞으면 정답이었는데,
     *          주관식은 문제 지문에 뜻이 그대로 노출되어 있어 지문을 복사하면 정답이 됐다.
     * [수정 3] correctAnswer 도 종류에 맞게 내려준다.
     *          객관식 오답 화면에 "억까 (억지로 까다)" 처럼 보기에 없는 문자열이 뜨던 문제 해결.
     */
    public QuizDto.CheckResponse checkAnswer(QuizDto.CheckRequest request) {
        if (request == null || request.quizId() == null) {
            throw new IllegalArgumentException("퀴즈 ID가 필요합니다.");
        }

        QuizWord quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈 ID입니다: " + request.quizId()));

        String submitted = normalize(request.answer());
        String word = quiz.getWord();       // 신조어
        String meaning = quiz.getAnswer();  // 뜻

        QuizDto.QuizType type = request.quizType();

        boolean correct;
        String correctAnswer;

        if (type == QuizDto.QuizType.MULTIPLE_CHOICE) {
            correct = normalize(meaning).equals(submitted);
            correctAnswer = meaning;
        } else if (type == QuizDto.QuizType.INITIAL_SOUND || type == QuizDto.QuizType.SUBJECTIVE) {
            correct = normalize(word).equals(submitted);
            correctAnswer = word;
        } else {
            // quizType 을 보내지 않는 예전 클라이언트를 위한 하위 호환 경로
            correct = normalize(meaning).equals(submitted) || normalize(word).equals(submitted);
            correctAnswer = word + " (" + meaning + ")";
        }

        return new QuizDto.CheckResponse(correct, correctAnswer);
    }

    /**
     * id 목록만 읽어 Java 에서 셔플한 뒤 필요한 개수만 조회한다.
     * ORDER BY RAND() 는 MySQL 전용이라 PostgreSQL 에서 실패하기 때문에 쓰지 않는다.
     */
    private List<QuizWord> findRandomQuizzes(int count) {
        List<Long> ids = new ArrayList<>(quizRepository.findAllIds());
        Collections.shuffle(ids);
        List<Long> selectedIds = ids.stream().limit(count).toList();

        Map<Long, QuizWord> quizWordsById = quizRepository.findAllById(selectedIds).stream()
                .collect(Collectors.toMap(QuizWord::getId, quizWord -> quizWord));

        return selectedIds.stream()
                .map(quizWordsById::get)
                .filter(Objects::nonNull)
                .toList();
    }

    /** 공백 제거 + 소문자 통일. null 은 빈 문자열로 취급해 NPE 를 막는다. */
    private String normalize(String value) {
        if (value == null) return "";
        return value.trim().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }
}
