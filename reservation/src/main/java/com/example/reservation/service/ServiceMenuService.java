package com.example.reservation.service;

import java.util.stream.Collectors;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.reservation.dto.ServiceMenuResponse;
import com.example.reservation.repository.ServiceMenuRepository;
import com.example.reservation.dto.ServiceMenuRequest;
import com.example.reservation.entity.ServiceMenu;
import com.example.reservation.exception.ResourceNotFoundException;

/**
 * サービスメニュー管理のビジネスロジックを提供するServiceクラス
 */
@Service
public class ServiceMenuService {

    private final ServiceMenuRepository serviceMenuRepository;

    public ServiceMenuService(ServiceMenuRepository serviceMenuRepository) {
        this.serviceMenuRepository = serviceMenuRepository;
    }

    /**
     * 新しいサービスメニューの作成
     * 
     * @param request サービスメニュー作成リクエスト
     * @return 作成されたサービスメニュー情報
     */
    @Transactional
    public ServiceMenuResponse createServiceMenu(ServiceMenuRequest request) {
        ServiceMenu serviceMenu = ServiceMenu.builder()
            .name(request.getName())
            .description(request.getDescription())
            .durationMinutes(request.getDurationMinutes())
            .price(request.getPrice())
            .build();

        ServiceMenu savedServiceMenu = serviceMenuRepository.save(serviceMenu);

        return convertToResponse(savedServiceMenu);
    }

    /**
     * すべてのサービスメニューを取得する
     *
     * @return サービスメニューのリスト
     */
    public List<ServiceMenuResponse> getAllServiceMenus() {
        return serviceMenuRepository.findAll()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    /**
     * IDを指定してサービスメニューを取得する
     *
     * @param id サービスメニューID
     * @return サービスメニュー情報
     * @throws ResourceNotFoundException サービスメニューが見つからない場合
     */
    public ServiceMenuResponse getServiceMenuById(Long id) {
        ServiceMenu serviceMenu = serviceMenuRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません: ID=" + id));

        return convertToResponse(serviceMenu);
    }

    /**
     * サービスメニューの更新
     *
     * @param id サービスメニューID
     * @param request サービスメニュー更新リクエスト
     * @return 更新されたサービスメニュー情報
     * @throws ResourceNotFoundException サービスメニューが見つからない場合
     */
    @Transactional
    public ServiceMenuResponse updateServiceMenu(Long id, ServiceMenuRequest request) {
        ServiceMenu serviceMenu = serviceMenuRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません: ID=" + id));

        serviceMenu.setName(request.getName());
        serviceMenu.setDescription(request.getDescription());
        serviceMenu.setDurationMinutes(request.getDurationMinutes());
        serviceMenu.setPrice(request.getPrice());

        ServiceMenu updatedMenu = serviceMenuRepository.save(serviceMenu);

        return convertToResponse(updatedMenu);
    }

    /**
     * サービスメニューの削除
     *
     * @param id サービスメニューID
     * @throws ResourceNotFoundException サービスメニューが見つからない場合
     */
    @Transactional
    public void deleteServiceMenu(Long id) {
        ServiceMenu serviceMenu = serviceMenuRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("サービスメニューが見つかりません: ID=" + id));

        serviceMenuRepository.delete(serviceMenu);
    }

    /**
     * ServiceMenuエンティティをServiceMenuResponseに変換
     * 
     * @param serviceMenu サービスメニューエンティティ
     * @return サービスメニューレスポンスDTO
     */
    private ServiceMenuResponse convertToResponse(ServiceMenu serviceMenu) {
        return ServiceMenuResponse.builder()
            .id(serviceMenu.getId())
            .name(serviceMenu.getName())
            .description(serviceMenu.getDescription())
            .durationMinutes(serviceMenu.getDurationMinutes())
            .price(serviceMenu.getPrice())
            .build();
    }

}