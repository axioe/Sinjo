package com.slangs.sinjo.dto;

import java.util.List;

public record WordSearchResponse(
    boolean found,
    List<WordAnswer> wordAnswers){
}
