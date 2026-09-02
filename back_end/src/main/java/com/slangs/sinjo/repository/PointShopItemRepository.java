package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.PointShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointShopItemRepository extends JpaRepository<PointShopItem, Long> {

    List<PointShopItem> findAllByOrderByIdAsc();
}
