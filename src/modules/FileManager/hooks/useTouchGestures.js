// src/modules/FileManager/hooks/useTouchGestures.js
import { useRef, useCallback } from 'react';

/**
 * Hook nhận diện cử chỉ cảm ứng: Nhấn giữ (Long-Press) vs Cuộn trang vs Chạm (Tap)
 * - Tự động hủy nếu người dùng di chuyển ngón tay để cuộn trang.
 * - Rung haptic khi nhấn giữ thành công.
 * - Chặn click giả lập sau khi nhấn giữ để không bị tự mở file.
 *
 * @param {Object} params
 * @param {Function} params.onLongPress - Callback kích hoạt khi nhấn giữ đủ thời gian
 * @param {number} [params.delay=450] - Thời gian nhấn giữ tính bằng ms
 * @param {number} [params.moveThreshold=10] - Khoảng cách xê dịch ngón tay tối đa tính bằng px
 */
export function useTouchGestures({ onLongPress, delay = 450, moveThreshold = 10 }) {
  const timerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isLongPressRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressRef.current = false;
    clearTimer();

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(40);
        }
      } catch {
        // Trình duyệt không hỗ trợ rung haptic
      }
      onLongPress?.(e);
    }, delay);
  }, [clearTimer, delay, onLongPress]);

  const handleTouchMove = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPosRef.current.x);
    const dy = Math.abs(touch.clientY - startPosRef.current.y);

    // Nếu ngón tay di chuyển vượt ngưỡng, người dùng đang cuộn trang -> HỦY BỘ ĐẾM NGAY
    if (dx > moveThreshold || dy > moveThreshold) {
      clearTimer();
    }
  }, [clearTimer, moveThreshold]);

  const handleTouchEnd = useCallback((e) => {
    clearTimer();
    if (isLongPressRef.current) {
      // Ngăn chặn click giả lập của trình duyệt sau khi vừa hoàn thành nhấn giữ
      if (e.cancelable) e.preventDefault();
      setTimeout(() => {
        isLongPressRef.current = false;
      }, 350);
    }
  }, [clearTimer]);

  const handleClickCapture = useCallback((e) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    clearTimer();
    isLongPressRef.current = false;
  }, [clearTimer]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onClickCapture: handleClickCapture,
  };
}
