import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createShareUrl } from '../../utils/shareUtils';

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
}

export function useFileSharing() {
  const [shareItem, setShareItem] = useState(null);
  const shareUrl = useMemo(
    () => shareItem ? createShareUrl(window.location.origin, shareItem) : '',
    [shareItem],
  );

  const handleShare = (item) => {
    if (item?.id) setShareItem(item);
  };

  const closeShareDialog = () => setShareItem(null);

  const copyShareUrl = async () => {
    try {
      await copyText(shareUrl);
      toast.success('Đã sao chép liên kết chia sẻ');
    } catch {
      toast.error('Không thể sao chép liên kết trên thiết bị này');
    }
  };

  const shareNatively = async () => {
    if (typeof navigator.share !== 'function') {
      await copyShareUrl();
      return;
    }

    try {
      await navigator.share({
        title: `Chia sẻ ${shareItem.name}`,
        text: `Mở ${shareItem.name} trên WindHub`,
        url: shareUrl,
      });
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('Không thể mở bảng chia sẻ');
    }
  };

  return {
    shareItem,
    shareUrl,
    handleShare,
    closeShareDialog,
    copyShareUrl,
    shareNatively,
  };
}