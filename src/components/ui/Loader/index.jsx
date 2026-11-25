import LoadingState from '@/components/os/LoadingState';

export default function Loader({ text = 'Đang xử lý...', fullScreen = false, size = 'md' }) {
  return <LoadingState label={text} fullScreen={fullScreen} size={size} />;
}
