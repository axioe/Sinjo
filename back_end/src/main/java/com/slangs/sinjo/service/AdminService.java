package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.AdminDto;
import com.slangs.sinjo.dto.QuizWordDto;
import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.entity.QuizWord;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.exception.DuplicateQuizWordException;
import com.slangs.sinjo.exception.DuplicateWordException;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.QuizRepository;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 관리자 기능 (REQ-ADM-01)
 * 화면구조 가이드라인 7장: 용어 관리, 회원 관리
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final WordRepository wordRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;

    /**
     * 관리자 페이지 첫 화면의 요약 숫자
     */
    @Transactional(readOnly = true)
    public AdminDto.Summary getSummary() {
        return new AdminDto.Summary(
                userRepository.count(),
                wordRepository.count(),
                quizRepository.count()
        );
    }

    // ---- 용어 관리 --------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WordDto> getWords() {
        return wordRepository.findAllByOrderByIdDesc()
                .stream()
                .map(WordDto::new)
                .toList();
    }

    @Transactional
    public WordDto createWord(AdminDto.WordRequest request) {
        String word = request.word().trim();
        String category = request.category().trim();

        if (wordRepository.existsByWord(word)) {
            throw new DuplicateWordException(word);
        }

        Word saved = wordRepository.save(new Word(
                word,
                request.meaning().trim(),
                request.example().trim(),
                category,
                request.era() == null ? null : request.era().trim()
        ));

        return new WordDto(saved);
    }

    @Transactional
    public WordDto updateWord(
            Long id,
            AdminDto.WordRequest request
    ) {
        Word target = wordRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "해당 신조어를 찾을 수 없습니다."
                        )
                );

        String word = request.word().trim();
        String category = request.category().trim();

        if (wordRepository.existsByWordAndIdNot(word, id)) {
            throw new DuplicateWordException(word);
        }

        target.update(
                word,
                request.meaning().trim(),
                request.example().trim(),
                category,
                request.era() == null
                        ? null
                        : request.era().trim()
        );

        return new WordDto(target);
    }

    @Transactional
    public void deleteWord(Long id) {
        if (!wordRepository.existsById(id)) {
            throw new NotFoundException("해당 신조어를 찾을 수 없습니다.");
        }
        wordRepository.deleteById(id);
    }

    // ---- 회원 관리 --------------------------------------------------------

    @Transactional(readOnly = true)
    public List<UserDto.AdminUserRow> getUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserDto.AdminUserRow::from)
                .toList();
    }

    // ---- 퀴즈 관리 --------------------------------------------------------

    @Transactional(readOnly = true)
    public List<QuizWordDto> getQuizWords() {
        return quizRepository.findAllByOrderByIdDesc()
                .stream()
                .map(QuizWordDto::new)
                .toList();
    }

    @Transactional
    public QuizWordDto createQuizWord(AdminDto.QuizWordRequest request) {
        String word = request.word().trim();

        if (quizRepository.existsByWord(word)) {
            throw new DuplicateQuizWordException(word);
        }

        QuizWord saved = quizRepository.save(new QuizWord(
                word,
                request.answer().trim(),
                cleanOptions(request.options()),
                request.description() == null ? null : request.description().trim()
        ));

        return new QuizWordDto(saved);
    }

    @Transactional
    public QuizWordDto updateQuizWord(Long id, AdminDto.QuizWordRequest request) {
        QuizWord target = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("해당 퀴즈 문제를 찾을 수 없습니다."));

        String word = request.word().trim();

        if (quizRepository.existsByWordAndIdNot(word, id)) {
            throw new DuplicateQuizWordException(word);
        }

        target.update(
                word,
                request.answer().trim(),
                cleanOptions(request.options()),
                request.description() == null ? null : request.description().trim()
        );

        return new QuizWordDto(target);
    }

    @Transactional
    public void deleteQuizWord(Long id) {
        if (!quizRepository.existsById(id)) {
            throw new NotFoundException("해당 퀴즈 문제를 찾을 수 없습니다.");
        }
        quizRepository.deleteById(id);
    }

    /** 빈 문자열/공백만 있는 오답 보기를 걸러낸다. */
    private List<String> cleanOptions(List<String> options) {
        if (options == null) {
            return new ArrayList<>();
        }
        return options.stream()
                .map(String::trim)
                .filter(option -> !option.isBlank())
                .toList();
    }
}