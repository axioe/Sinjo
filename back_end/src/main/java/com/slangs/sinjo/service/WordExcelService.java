package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.ExcelPreviewRow;
import com.slangs.sinjo.dto.ExcelUploadResult;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

    /**
     * 저장하지 않고 검증만 한다.
     * 파싱 규칙이 upload 와 어긋나면 미리보기가 거짓말을 하게 되므로
     * 셀 읽기·검증 조건은 항상 양쪽을 같이 고쳐야 한다.
     */
    @Transactional(readOnly = true)
    public List<ExcelPreviewRow> preview(MultipartFile file) throws IOException {
        List<ExcelPreviewRow> rows = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isEmptyRow(row)) continue;

                String word     = getString(row, 0);
                String meaning  = getString(row, 1);
                String example  = getString(row, 2);
                String category = getString(row, 3);
                String era      = getString(row, 4);

                String status;
                String message;

                if (word.isEmpty() || meaning.isEmpty() || example.isEmpty()) {
                    status = "ERROR";
                    message = "신조어·뜻·예문은 필수입니다.";
                } else if (meaning.length() > 500 || example.length() > 500) {
                    status = "ERROR";
                    message = "뜻 또는 예문이 500자를 넘습니다.";
                } else if (!seen.add(word)) {
                    status = "DUPLICATE";
                    message = "파일 안에 같은 단어가 중복됩니다.";
                } else if (wordRepository.existsByWord(word)) {
                    status = "DUPLICATE";
                    message = "이미 등록된 단어입니다.";
                } else {
                    status = "OK";
                    message = "";
                }

                rows.add(new ExcelPreviewRow(
                        i + 1, word, meaning, example,
                        category.isEmpty() ? "기타" : category,
                        era, status, message
                ));
            }
        }

        return rows;
    }

//  엑셀 업로드 양식 생성
    private static final String[] HEADERS =
            {"신조어", "뜻", "예문", "카테고리", "시대"};

    public byte[] createTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("신조어");

            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
                sheet.setColumnWidth(i, 5000);
            }

            // 작성 예시 한 줄. 형식을 글로 설명하는 것보다 확실하다.
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("갓생");
            sample.createCell(1).setCellValue("부지런하고 계획적인 삶");
            sample.createCell(2).setCellValue("요즘 운동하면서 갓생 살고 있어.");
            sample.createCell(3).setCellValue("일상");
            sample.createCell(4).setCellValue("2020");

            workbook.write(out);
            return out.toByteArray();
        }
    }
}