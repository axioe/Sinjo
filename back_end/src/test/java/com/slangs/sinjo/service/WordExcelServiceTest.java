package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.ExcelPreviewRow;
import com.slangs.sinjo.dto.ExcelUploadResult;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.WordRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-ADMIN-04: 신조어 엑셀 일괄 업로드/미리보기/템플릿.
 * 실제 Apache POI로 만든 xlsx 바이트를 그대로 업로드/미리보기에 태워, 파싱-검증 규칙
 * (upload/preview 가 서로 어긋나면 안 된다는 WordExcelService 주석의 전제)을 확인한다.
 */
@ExtendWith(MockitoExtension.class)
class WordExcelServiceTest {

    @Mock
    private WordRepository wordRepository;

    @InjectMocks
    private WordExcelService wordExcelService;

    /** rows: 각 행이 {word, meaning, example, category, era} 5개 문자열. */
    private MockMultipartFile excelOf(String[]... rows) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("신조어");
            sheet.createRow(0); // 헤더 - 내용은 안 읽으므로 비워둔다.

            for (int i = 0; i < rows.length; i++) {
                Row row = sheet.createRow(i + 1);
                String[] cells = rows[i];
                for (int c = 0; c < cells.length; c++) {
                    row.createCell(c).setCellValue(cells[c]);
                }
            }

            workbook.write(out);
            return new MockMultipartFile(
                    "file", "words.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    new ByteArrayInputStream(out.toByteArray()));
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-04: 엑셀 업로드")
    class Upload {

        @Test
        void 정상_행은_저장된다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "부지런한 삶", "갓생 산다", "일상", "2020"}
            );

            ExcelUploadResult result = wordExcelService.upload(file);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            verify(wordRepository).save(any());
        }

        @Test
        void 필수값이_비어있으면_실패로_기록하고_저장하지_않는다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"", "뜻만 있음", "예문", "일상", ""}
            );

            ExcelUploadResult result = wordExcelService.upload(file);

            assertThat(result.getFailures()).hasSize(1);
            assertThat(result.getFailures().get(0)).contains("필수");
            verify(wordRepository, never()).save(any());
        }

        @Test
        void 같은_파일_안에서_중복된_단어는_두번째부터_건너뛴다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "뜻1", "예문1", "일상", ""},
                    new String[]{"갓생", "뜻2", "예문2", "일상", ""}
            );

            ExcelUploadResult result = wordExcelService.upload(file);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getSkipCount()).isEqualTo(1);
        }

        @Test
        void DB에_이미_있는_단어는_건너뛴다() throws Exception {
            when(wordRepository.existsByWord("갓생")).thenReturn(true);
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "뜻", "예문", "일상", ""}
            );

            ExcelUploadResult result = wordExcelService.upload(file);

            assertThat(result.getSkipCount()).isEqualTo(1);
            verify(wordRepository, never()).save(any());
        }

        @Test
        void 카테고리가_비어있으면_기타로_저장된다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "뜻", "예문", "", ""}
            );

            wordExcelService.upload(file);

            verify(wordRepository).save(argThat((Word word) -> word.getCategory().equals("기타")));
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-04: 엑셀 미리보기")
    class Preview {

        @Test
        void 정상_행은_OK로_분류된다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "뜻", "예문", "일상", ""}
            );

            List<ExcelPreviewRow> rows = wordExcelService.preview(file);

            assertThat(rows).hasSize(1);
            assertThat(rows.get(0).status()).isEqualTo("OK");
        }

        @Test
        void 필수값_누락은_ERROR로_분류된다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"", "뜻", "예문", "일상", ""}
            );

            List<ExcelPreviewRow> rows = wordExcelService.preview(file);

            assertThat(rows.get(0).status()).isEqualTo("ERROR");
        }

        @Test
        void 이미_등록된_단어는_DUPLICATE로_분류된다() throws Exception {
            when(wordRepository.existsByWord("갓생")).thenReturn(true);
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "뜻", "예문", "일상", ""}
            );

            List<ExcelPreviewRow> rows = wordExcelService.preview(file);

            assertThat(rows.get(0).status()).isEqualTo("DUPLICATE");
        }

        @Test
        void 미리보기는_실제로_저장하지_않는다() throws Exception {
            MockMultipartFile file = excelOf(
                    new String[]{"갓생", "뜻", "예문", "일상", ""}
            );

            wordExcelService.preview(file);

            verify(wordRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-04: 엑셀 템플릿")
    class Template {

        @Test
        void 헤더와_예시_한_줄을_담은_엑셀을_만든다() throws Exception {
            byte[] bytes = wordExcelService.createTemplate();

            try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
                Sheet sheet = workbook.getSheetAt(0);
                Row header = sheet.getRow(0);
                Row sample = sheet.getRow(1);

                assertThat(header.getCell(0).getStringCellValue()).isEqualTo("신조어");
                assertThat(header.getCell(1).getStringCellValue()).isEqualTo("뜻");
                assertThat(sample.getCell(0).getStringCellValue()).isEqualTo("갓생");
            }
        }
    }
}
