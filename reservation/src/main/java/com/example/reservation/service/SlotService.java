package com.example.reservation.service;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.reservation.dto.SlotRequest;
import com.example.reservation.dto.SlotResponse;
import com.example.reservation.entity.ReservationStatus;
import com.example.reservation.entity.ServiceMenu;
import com.example.reservation.entity.Slot;
import com.example.reservation.entity.SlotStatus;
import com.example.reservation.exception.InvalidRequestException;
import com.example.reservation.exception.ResourceNotFoundException;
import com.example.reservation.repository.ReservationRepository;
import com.example.reservation.repository.ServiceMenuRepository;
import com.example.reservation.repository.SlotRepository;

@Service
public class SlotService {

    private final SlotRepository slotRepository;
    private final ServiceMenuRepository serviceMenuRepository;
    private final ReservationRepository reservationRepository;

    public SlotService(
        SlotRepository slotRepository,
        ServiceMenuRepository serviceMenuRepository,
        ReservationRepository reservationRepository
    ) {
        this.slotRepository = slotRepository;
        this.serviceMenuRepository = serviceMenuRepository;
        this.reservationRepository = reservationRepository;
    }

    /**
     * 新規スロット作成
     * @param request スロット作成リクエスト
     * @return 作成されたスロット
     * @throws ResourceNotFoundException サービスメニューが見つからない場合
     * @throws InvalidRequestException 開始時刻が終了時刻より後の場合
     */
    @Transactional
    public SlotResponse createSlot(SlotRequest request) {
        // サービスメニューを取得
        ServiceMenu serviceMenu = serviceMenuRepository.findById(request.getServiceMenuId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "サービスメニューが見つかりません: ID=" + request.getServiceMenuId()
            ));

        // 開始時刻が終了時刻より後の場合エラー
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new InvalidRequestException("開始時刻は終了時刻より前である必要があります");
        }

        // スロット作成
        Slot slot = Slot.builder()
            .serviceMenu(serviceMenu)
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .capacity(request.getCapacity())
            .status(SlotStatus.AVAILABLE)
            .build();

        Slot savedSlot = slotRepository.save(slot);

        return convertToResponse(savedSlot);
    }

    /**
     * 日付範囲を指定してスロット一覧を取得する
     * @param startTime 検索開始時刻
     * @param endTime 検索終了時刻
     * @return スロットのリスト
     */
    public List<SlotResponse> getSlotsByDateRange(LocalDateTime startTime, LocalDateTime endTime) {
        return slotRepository.findByStartTimeBetween(startTime, endTime)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    /**
     * 条件を指定してスロット一覧を取得する
     * すべてのパラメータはオプショナルで、指定された条件でフィルタリングされます。
     *
     * @param from 検索開始時刻（オプショナル）
     * @param to 検索終了時刻（オプショナル）
     * @param menuId サービスメニューID（オプショナル）
     * @return 条件に一致するスロットのリスト
     */
    public List<SlotResponse> getAllSlots(LocalDateTime from, LocalDateTime to, Long menuId) {
        List<Slot> slots;

        if (from != null && to != null && menuId != null) {
            // 日付範囲とメニューIDの両方で検索
            slots = slotRepository.findByServiceMenuIdAndStartTimeBetween(menuId, from, to);
        } else if (from != null && to != null) {
            // 日付範囲のみで検索
            slots = slotRepository.findByStartTimeBetween(from, to);
        } else if (menuId != null) {
            // メニューIDのみで検索
            slots = slotRepository.findByServiceMenuIdOrderByStartTimeAsc(menuId);
        } else {
            // 全件取得
            slots = slotRepository.findAll();
        }

        return slots.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    /**
     * IDを指定してスロットを作成する
     * @param id スロットID
     * @return スロット情報
     * @throws ResourceNotFoundException スロットが見つからない場合
     */
    public SlotResponse getSlotById(Long id) {
        Slot slot = slotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("スロットが見つかりません: ID=" + id));

        return convertToResponse(slot);
    }

    /**
     * スロットの更新
     * @param id スロットのID
     * @param request スロット更新リクエスト
     * @return 更新されたスロット情報
     * @throws ResourceNotFoundException スロットまたはサービスメニューが見つからない場合
     * @throws InvalidRequestException 開始時刻が終了時刻より後の場合、定員を既存予約数未満に減少させようとした場合
     */
    @Transactional
    public SlotResponse updateSlot(Long id, SlotRequest request) {
        Slot slot = slotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("スロットが見つかりません: ID=" + id));

        // サービスメニューを取得
        ServiceMenu serviceMenu = serviceMenuRepository.findById(request.getServiceMenuId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "サービスメニューが見つかりません: ID=" + request.getServiceMenuId()
            ));

        // 開始時刻が終了時刻より後の場合エラー
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new InvalidRequestException("開始時刻は終了時刻より前である必要があります");
        }

        // 定員減少制限：既存予約数より少ない定員には変更不可
        long reservedCount = reservationRepository.countBySlotIdAndStatus(
            slot.getId(),
            ReservationStatus.RESERVED
        );
        if (request.getCapacity() < reservedCount) {
            throw new InvalidRequestException(
                "現在の予約数（" + reservedCount + "件）より少ない定員には変更できません"
            );
        }

        slot.setServiceMenu(serviceMenu);
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setCapacity(request.getCapacity());

        Slot updatedSlot = slotRepository.save(slot);

        return convertToResponse(updatedSlot);
    }

    /**
     * スロットの削除
     * @param id スロットのID
     * @throws ResourceNotFoundException スロットが見つからない場合
     */
    @Transactional
    public void deleteSlot(Long id) {
        Slot slot = slotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("スロットが見つかりません: ID=" + id));

        slotRepository.delete(slot);
    }

    /**
     * SlotエンティティをSlotResponseに変換
     * @param slot スロットエンティティ
     * @return スロットレスポンスID
     */
    private SlotResponse convertToResponse(Slot slot) {
        // 現在の予約数を取得
        long reservedCount = reservationRepository.countBySlotIdAndStatus(
            slot.getId(),
            ReservationStatus.RESERVED
        );

        // 残席数を計算
        int availableSeats = slot.getCapacity() - (int) reservedCount;

        return SlotResponse.builder()
            .id(slot.getId())
            .serviceMenuId(slot.getServiceMenu().getId())
            .serviceMenuName(slot.getServiceMenu().getName())
            .startTime(slot.getStartTime())
            .endTime(slot.getEndTime())
            .capacity(slot.getCapacity())
            .reservedCount((int) reservedCount)
            .availableSeats(availableSeats)
            .status(slot.getStatus().name())
            .build();
    }
}