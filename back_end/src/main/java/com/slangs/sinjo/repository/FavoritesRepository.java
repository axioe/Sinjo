package com.slangs.sinjo.repository;

import com.slangs.sinjo.dto.FavoritesDto;
import com.slangs.sinjo.entity.Favorites;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoritesRepository extends JpaRepository<Favorites, Long> {

    @Query("""
        select new com.slangs.sinjo.dto.FavoritesDto(
            f.id, w.id, w.word, w.meaning, w.category, f.createdAt)
        from Favorites f
        join Word w on w.id = f.wordId
        where f.userId = :userId
        order by f.createdAt desc
        """)
    Page<FavoritesDto> findFavorites(@Param("userId") Long userId, Pageable pageable);

    long countByUserId(Long userId);

    boolean existsByUserIdAndWordId(Long userId, Long wordId);

    void deleteByUserIdAndWordId(Long userId, Long wordId);
}