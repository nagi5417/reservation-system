package com.example.reservation.repository;

import com.example.reservation.entity.ServiceMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceMenuRepository extends JpaRepository<ServiceMenu, Long> {

    // すべてのサービスメニューを取得（作成日時の降順）
    List<ServiceMenu> findAllByOrderByCreatedAtDesc();
}
