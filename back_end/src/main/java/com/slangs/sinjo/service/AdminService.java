package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.AdminDto;
import com.slangs.sinjo.dto.PointDto;
import com.slangs.sinjo.dto.QuizWordDto;
import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.entity.QuizWord;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.exception.DuplicateWordException;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.AttendanceRepository;
import com.slangs.sinjo.repository.PointShopItemRepository;
import com.slangs.sinjo.repository.PointTransactionRepository;
import com.slangs.sinjo.repository.QuizAttemptRepository;
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
    private final QuizAttemptRepository quizAttemptRepository;
    private final AttendanceRepository attendanceRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final PointShopItemRepository pointShopItemRepository;

    /**
     * [추가] 객관식 퀴즈 오답 보기 최소 개수.
     * 이보다 적으면(0~1개) 객관식 게임에서 보기가 정답 1개뿐인 채로 나가
     * 문제로서 의미가 없어진다.
     */
    private static final int MIN_QUIZ_OPTIONS = 2;

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

    /**
     * [추가] 회원 권한 부여/해제.
     * adminId 는 이 API 를 호출한 관리자 본인이다 - 자기 자신의 권한을 스스로
     * 바꾸면 실수로 관리자 권한을 잃고 관리자 화면에서 튕겨나갈 수 있어 막는다.
     */
    @Transactional
    public UserDto.AdminUserRow updateUserRole(Long adminId, Long targetId, AdminDto.UpdateRoleRequest request) {
        if (adminId != null && adminId.equals(targetId)) {
            throw new IllegalArgumentException("자기 자신의 권한은 변경할 수 없습니다.");
        }

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new NotFoundException("해당 회원을 찾을 수 없습니다."));

        target.setRole(request.role());

        return UserDto.AdminUserRow.from(target);
    }

    /** [추가] 회원 닉네임 수정. 이메일은 로그인 식별자라 바꾸지 않는다. */
    @Transactional
    public UserDto.AdminUserRow updateUser(Long targetId, AdminDto.UpdateUserRequest request) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new NotFoundException("해당 회원을 찾을 수 없습니다."));

        target.setNickname(request.nickname().trim());

        return UserDto.AdminUserRow.from(target);
    }

    /**
     * [추가] 회원 삭제.
     * QuizAttempt/Attendance/PointTransaction 은 User 를 FK 로 참조해서(nullable = false)
     * 먼저 지우지 않으면 외래키 제약 위반으로 500 이 난다. Favorites/Translations/
     * LearningHistory 는 userId 를 Long 컬럼으로만 들고 있어(FK 아님) 제약에 걸리지는
     * 않지만, 삭제 후에도 데이터가 남는다 - 필요해지면 별도로 정리한다.
     */
    @Transactional
    public void deleteUser(Long adminId, Long targetId) {
        if (adminId != null && adminId.equals(targetId)) {
            throw new IllegalArgumentException("자기 자신은 삭제할 수 없습니다.");
        }

        if (!userRepository.existsById(targetId)) {
            throw new NotFoundException("해당 회원을 찾을 수 없습니다.");
        }

        quizAttemptRepository.deleteByUserId(targetId);
        attendanceRepository.deleteByUserId(targetId);
        pointTransactionRepository.deleteByUserId(targetId);

        userRepository.deleteById(targetId);
    }

    // ---- 퀴즈 관리 --------------------------------------------------------
    // [수정] 같은 단어로 문제를 두 개 이상(예: 객관식용/초성용) 만들 수 있어야 해서
    // 등록/수정 시 하던 중복 단어 검사(existsByWord)를 없앴다. QuizWord.word 의
    // unique 제약도 함께 뺐다 - 자세한 이유는 QuizWord.word 필드 주석 참고.

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

        List<String> options = cleanOptions(request.options());
        validateOptions(options);

        QuizWord saved = quizRepository.save(new QuizWord(
                word,
                request.answer().trim(),
                options,
                request.description() == null ? null : request.description().trim(),
                request.wordId()
        ));

        return new QuizWordDto(saved);
    }

    @Transactional
    public QuizWordDto updateQuizWord(Long id, AdminDto.QuizWordRequest request) {
        QuizWord target = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("해당 퀴즈 문제를 찾을 수 없습니다."));

        String word = request.word().trim();

        List<String> options = cleanOptions(request.options());
        validateOptions(options);

        target.update(
                word,
                request.answer().trim(),
                options,
                request.description() == null ? null : request.description().trim(),
                request.wordId()
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

    // ---- 포인트 상점 관리 ---------------------------------------------------
    // [추가] PointService.SHOP_ITEMS 고정 Map 을 대체하는 관리자 CRUD.
    // itemId 는 PointTransaction 에 FK 가 아니라 참고용 Long 으로만 남아 있어서
    // (QuizWord.wordId 와 같은 방식) 항목을 지워도 이미 산 기록의 "포인트 상점
    // 구매: 상품명" 문구는 그대로 남고, 상점 목록에서만 사라진다.

    @Transactional(readOnly = true)
    public List<PointDto.ShopItem> getPointShopItems() {
        return pointShopItemRepository.findAllByOrderByIdAsc()
                .stream()
                .map(item -> new PointDto.ShopItem(item.getId(), item.getName(), item.getPrice()))
                .toList();
    }

    @Transactional
    public PointDto.ShopItem createPointShopItem(AdminDto.PointShopItemRequest request) {
        PointShopItem saved = pointShopItemRepository.save(
                new PointShopItem(request.name().trim(), request.price())
        );

        return new PointDto.ShopItem(saved.getId(), saved.getName(), saved.getPrice());
    }

    @Transactional
    public PointDto.ShopItem updatePointShopItem(Long id, AdminDto.PointShopItemRequest request) {
        PointShopItem target = pointShopItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("해당 상품을 찾을 수 없습니다."));

        target.update(request.name().trim(), request.price());

        return new PointDto.ShopItem(target.getId(), target.getName(), target.getPrice());
    }

    @Transactional
    public void deletePointShopItem(Long id) {
        if (!pointShopItemRepository.existsById(id)) {
            throw new NotFoundException("해당 상품을 찾을 수 없습니다.");
        }
        pointShopItemRepository.deleteById(id);
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

    /** [추가] 오답 보기 개수를 최소 기준(cleanOptions 로 빈 값을 걸러낸 뒤) 검증한다. */
    private void validateOptions(List<String> options) {
        if (options.size() < MIN_QUIZ_OPTIONS) {
            throw new IllegalArgumentException(
                    "오답 보기를 " + MIN_QUIZ_OPTIONS + "개 이상 입력해 주세요."
            );
        }
    }
}