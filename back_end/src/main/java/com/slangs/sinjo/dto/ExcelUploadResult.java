package com.slangs.sinjo.dto;

import lombok.Getter;
import java.util.ArrayList;
import java.util.List;

@Getter
public class ExcelUploadResult {
    private int totalRows;
    private int successCount;
    private int skipCount;
    private final List<String> failures = new ArrayList<>();

    public void addSuccess() { successCount++; totalRows++; }
    public void addSkip()    { skipCount++;    totalRows++; }
    public void addFailure(int rowNum, String reason) {
        failures.add((rowNum + 1) + "행: " + reason);
        totalRows++;
    }
}