package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.ExcelUploadResult;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class WordExcelService {

    private final WordRepository wordRepository;

    @Transactional
    public ExcelUploadResult upload(MultipartFile file) throws IOException {
        ExcelUploadResult result = new ExcelUploadResult();

        // 같은 파일 안에서의 중복도 걸러야 한다.
        // DB 조회만으로는 아직 커밋 전인 앞줄과의 중복을 못 잡는다.
        Set<String> seen = new HashSet<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            // 0번은 헤더라 1번부터 읽는다.
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isEmptyRow(row)) continue;

                String word     = getString(row, 0);
                String meaning  = getString(row, 1);
                String example  = getString(row, 2);
                String category = getString(row, 3);
                String era      = getString(row, 4);

                if (word.isEmpty() || meaning.isEmpty() || example.isEmpty()) {
                    result.addFailure(i, "신조어·뜻·예문은 필수입니다.");
                    continue;
                }

                if (meaning.length() > 500 || example.length() > 500) {
                    result.addFailure(i, "뜻 또는 예문이 500자를 넘습니다.");
                    continue;
                }

                if (!seen.add(word) || wordRepository.existsByWord(word)) {
                    result.addSkip();
                    continue;
                }

                wordRepository.save(new Word(
                        word,
                        meaning,
                        example,
                        category.isEmpty() ? "기타" : category,
                        era.isEmpty() ? null : era
                ));
                result.addSuccess();
            }
        }

        return result;
    }

    /** 셀이 비었거나 숫자여도 문자열로 뽑아준다. */
    private String getString(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return "";

        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }

    private boolean isEmptyRow(Row row) {
        for (int i = 0; i < 5; i++) {
            if (!getString(row, i).isEmpty()) return false;
        }
        return true;
    }
}