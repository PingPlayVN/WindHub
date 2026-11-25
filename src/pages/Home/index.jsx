import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Clock,
  Command,
  FileText,
  FolderKanban,
  Globe2,
  HardDrive,
  Image as ImageIcon,
  Languages,
  Radio,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { FaGithub, FaYoutube } from 'react-icons/fa';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { getStoredFilesInRoot } from '@/modules/FileManager/utils/fileUtils';
import { Button, Card, EmptyState, Skeleton } from '@/components/os';
import { pageTransitionVariants, staggerContainerVariants, staggerItemVariants } from '@/design-system/motion';

function getGreetingByHour(hour) {
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const QUICK_LAUNCH_APPS = [
  {
    id: 'files',
    title: 'Kho Tệp Đám Mây',
    desc: 'Video, ảnh & tài liệu',
    path: '/files',
    icon: FolderKanban,
    tone: 'text-[var(--os-accent)] bg-[var(--os-accent-soft)] border-[var(--os-accent-border)]',
  },
  {
    id: 'p2p',
    title: 'P2P Direct Share',
    desc: 'Truyền trực tiếp WebRTC',
    path: '/p2p',
    icon: Radio,
    tone: 'text-[var(--os-success)] bg-[var(--os-success-soft)] border-[var(--os-success-border)]',
  },
  {
    id: 'casio',
    title: 'Casio fx-580 Spell',
    desc: 'Viết chữ ClassWiz 17 ký tự',
    path: '/tools?toolId=Casio580Spell',
    icon: Calculator,
    tone: 'text-[var(--os-info)] bg-[var(--os-info-soft)] border-[var(--os-info-border)]',
  },
  {
    id: 'ascii',
    title: 'ASCII Art Studio',
    desc: 'Chuyển ảnh sang ký tự',
    path: '/tools?toolId=ImageArtStudio',
    icon: Sparkles,
    tone: 'text-[var(--os-warning)] bg-[var(--os-warning-soft)] border-[var(--os-warning-border)]',
  },
  {
    id: 'vocab',
    title: 'Ôn Luyện Từ Vựng',
    desc: 'Tạo bảng từ & dò bài',
    path: '/tools?toolId=VocabularyPractice',
    icon: Languages,
    tone: 'text-[var(--os-success)] bg-[var(--os-success-soft)] border-[var(--os-success-border)]',
  },
  {
    id: 'extensions',
    title: 'OSINT & Anime Trace',
    desc: 'Quét URL & tìm tập phim',
    path: '/extensions',
    icon: Globe2,
    tone: 'text-[var(--os-info)] bg-[var(--os-info-soft)] border-[var(--os-info-border)]',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, player, isAdmin } = useAuthStore();

  const [stats, setStats] = useState({ total: 0, image: 0, document: 0, video: 0, raw: 0 });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'windhub_files'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

        const filesByRoot = {
          video: getStoredFilesInRoot(docs, 'root_video'),
          image: getStoredFilesInRoot(docs, 'root_image'),
          document: getStoredFilesInRoot(docs, 'root_document'),
          raw: getStoredFilesInRoot(docs, 'root_other'),
        };

        const newStats = {
          total: Object.values(filesByRoot).reduce((total, files) => total + files.length, 0),
          image: filesByRoot.image.length,
          document: filesByRoot.document.length,
          video: filesByRoot.video.length,
          raw: filesByRoot.raw.length,
        };

        setStats(newStats);
        setRecentFiles(docs.filter((item) => item.type !== 'folder').slice(0, 6));
        setError('');
        setLoading(false);
      },
      () => {
        setError('Không thể đồng bộ dữ liệu lưu trữ lúc này. Vui lòng kiểm tra kết nối mạng.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const firstName = useMemo(() => {
    const rawName = player?.displayName || user?.displayName;
    if (!rawName) return null;
    return rawName.trim().split(/\s+/).slice(-1)[0] || rawName;
  }, [player?.displayName, user?.displayName]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }).format(now),
    [now]
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(now),
    [now]
  );

  const statWidgets = [
    {
      id: 'total',
      title: 'Tổng tài nguyên',
      subtitle: `${stats.raw} tệp định dạng khác`,
      value: stats.total,
      icon: HardDrive,
      badgeTone: 'bg-[var(--os-accent-soft)] text-[var(--os-accent)] border-[var(--os-accent-border)]',
      barColor: 'bg-[var(--os-accent)]',
    },
    {
      id: 'image',
      title: 'Hình ảnh',
      subtitle: 'PNG, JPG, WEBP chất lượng cao',
      value: stats.image,
      icon: ImageIcon,
      badgeTone: 'bg-[var(--os-success-soft)] text-[var(--os-success)] border-[var(--os-success-border)]',
      barColor: 'bg-[var(--os-success)]',
    },
    {
      id: 'document',
      title: 'Tài liệu',
      subtitle: 'PDF, DOCX, XLSX, PPTX',
      value: stats.document,
      icon: FileText,
      badgeTone: 'bg-[var(--os-info-soft)] text-[var(--os-info)] border-[var(--os-info-border)]',
      barColor: 'bg-[var(--os-info)]',
    },
    {
      id: 'video',
      title: 'Video & Media',
      subtitle: 'Phát trực tuyến tức thì',
      value: stats.video,
      icon: Video,
      badgeTone: 'bg-[var(--os-warning-soft)] text-[var(--os-warning)] border-[var(--os-warning-border)]',
      barColor: 'bg-[var(--os-warning)]',
    },
  ];

  const totalNonZero = Math.max(stats.total, 1);

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="dashboard-shell mx-auto flex w-full max-w-7xl flex-col gap-5 pb-6"
    >
      {/* 1. HERO OS CONTROL BANNER */}
      <section className="os-card relative overflow-hidden rounded-[var(--radius-2xl)] p-5 sm:p-7 md:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[var(--os-accent-soft)] blur-3xl"
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-3 py-1 font-mono text-[11px] font-bold text-[var(--os-accent)]">
                <span className="size-1.5 rounded-full bg-[var(--os-accent)]" />
                WINDOS WORKSPACE
              </span>
              <span className="rounded-full border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--os-text-muted)] capitalize">
                {formattedDate} · {formattedTime}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--os-success)]">
                  <ShieldCheck size={12} /> Quyền Admin
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
              {getGreetingByHour(now.getHours())}
              {firstName ? `, ${firstName}` : ''}!
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)]">
              Không gian lưu trữ đám mây, bộ công cụ kỹ thuật và truyền tệp trực tiếp P2P của WindHub đã sẵn sàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              icon={<FolderKanban size={17} />}
              trailingIcon={<ArrowRight size={15} />}
              onClick={() => navigate('/files')}
            >
              Mở Kho Tệp
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Radio size={16} />}
              onClick={() => navigate('/p2p')}
            >
              P2P Share
            </Button>
            <Button
              variant="subtle"
              size="md"
              icon={<Command size={16} />}
              onClick={() => navigate('/tools')}
            >
              Hệ sinh thái Công cụ
            </Button>
          </div>
        </div>
      </section>

      {/* 2. KPI STORAGE SERVICE WIDGETS */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} padding="md" className="space-y-4">
              <Skeleton className="size-11" rounded="lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card padding="md" className="border-[var(--os-danger-border)] bg-[var(--os-danger-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--os-danger)]">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          </div>
        </Card>
      ) : (
        <motion.section
          aria-label="Thống kê tài nguyên lưu trữ"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
        >
          {statWidgets.map((widget) => {
            const Icon = widget.icon;
            const ratio = widget.id === 'total' ? 100 : Math.round((widget.value / totalNonZero) * 100);
            return (
              <motion.div key={widget.id} variants={staggerItemVariants}>
                <Card
                  interactive
                  padding="md"
                  onClick={() => navigate('/files')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/files');
                    }
                  }}
                  aria-label={`${widget.title}: ${widget.value} mục. Nhấn để mở Quản lý Tệp`}
                  className="h-full flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`flex size-11 items-center justify-center rounded-[var(--radius-md)] border ${widget.badgeTone}`}>
                      <Icon size={20} />
                    </span>
                    <ArrowUpRight size={16} className="text-[var(--os-text-subtle)]" />
                  </div>

                  <div>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-[var(--os-text-primary)]">
                      {widget.value.toLocaleString()}
                    </p>
                    <h2 className="mt-0.5 text-xs sm:text-sm font-bold text-[var(--os-text-primary)]">
                      {widget.title}
                    </h2>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--os-text-muted)]">
                      {widget.subtitle}
                    </p>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--os-surface-sunken)]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${widget.barColor}`}
                      style={{ width: `${stats.total === 0 ? 0 : Math.max(ratio, widget.value > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.section>
      )}

      {/* 3. BENTO MAIN WORKSPACE: QUICK APPS + RECENT FILES + ECOSYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Columns: Quick Launch Service Tiles + Ecosystem Info */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--os-text-primary)]">
                  Truy cập nhanh ứng dụng
                </h2>
                <p className="text-xs text-[var(--os-text-muted)]">
                  Khởi chạy tức thì các tiện ích cốt lõi trong hệ sinh thái WindHub
                </p>
              </div>
              <Link
                to="/tools"
                className="os-focus-ring inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-bold text-[var(--os-accent)] hover:bg-[var(--os-accent-soft)]"
              >
                <span>Tất cả</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {QUICK_LAUNCH_APPS.map((app) => {
                const Icon = app.icon;
                return (
                  <Link
                    key={app.id}
                    to={app.path}
                    className="os-focus-ring group flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-3.5 transition-all hover:border-[var(--os-accent-border)] hover:bg-[var(--os-surface-1)] hover:shadow-[var(--os-shadow-xs)]"
                  >
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border ${app.tone}`}>
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs sm:text-sm font-bold text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
                        {app.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--os-text-muted)]">
                        {app.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* About WindHub & Official Channels */}
          <Card padding="md" className="relative overflow-hidden flex-1 flex flex-col justify-between gap-5">
            <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.04] dark:opacity-[0.06] text-[var(--os-text-primary)]">
              <ShieldCheck size={148} />
            </div>

            <div className="relative z-10">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--os-accent)]">
                ECOSYSTEM // VERIFIED REPOSITORY
              </span>
              <h2 className="mt-1 text-base sm:text-lg font-bold text-[var(--os-text-primary)]">
                Về nền tảng WindHub
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)] max-w-xl">
                Kho lưu trữ tập trung và bộ công cụ cá nhân an toàn. Toàn bộ tài nguyên công khai đều được kiểm duyệt bởi Quản trị viên, kết hợp truyền tải ngang hàng P2P mã hóa đầu cuối DTLS.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://github.com/PingPlayVN"
                target="_blank"
                rel="noreferrer"
                className="os-focus-ring group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 py-3 transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-1)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <FaGithub size={19} className="shrink-0 text-[var(--os-text-primary)]" />
                  <span className="truncate text-xs sm:text-sm font-semibold text-[var(--os-text-primary)]">
                    Trịnh Gia Phong (GitHub)
                  </span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-[var(--os-text-muted)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <a
                href="https://www.youtube.com/@PingPlayVN"
                target="_blank"
                rel="noreferrer"
                className="os-focus-ring group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 py-3 transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-1)]"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <FaYoutube size={19} className="shrink-0 text-red-500" />
                  <span className="truncate text-xs sm:text-sm font-semibold text-[var(--os-text-primary)]">
                    Kênh YouTube PingPlayVN
                  </span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-[var(--os-text-muted)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </Card>
        </div>

        {/* Right 5 Columns: Recent Files Stream */}
        <Card padding="none" className="lg:col-span-5 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between gap-2 border-b border-[var(--os-border-subtle)] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8.5 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-info-soft)] text-[var(--os-info)]">
                <Clock size={17} />
              </span>
              <div>
                <h2 className="text-base font-bold text-[var(--os-text-primary)]">
                  Tệp tin mới cập nhật
                </h2>
                <p className="text-[11px] text-[var(--os-text-muted)]">
                  Đồng bộ trực tiếp từ Cloud Firestore
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-2.5 p-2">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0" rounded="md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentFiles.length === 0 ? (
              <EmptyState
                compact
                icon={<HardDrive size={24} />}
                title="Chưa có tệp tin mới"
                description="Các tệp được tải lên hoặc dán liên kết gần đây sẽ xuất hiện tại đây."
                action={
                  <Button variant="subtle" size="sm" onClick={() => navigate('/files')}>
                    Mở Quản lý Tệp
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-1.5">
                {recentFiles.map((file) => {
                  const Icon =
                    file.type === 'image' ? ImageIcon : file.type === 'video' ? Video : FileText;
                  return (
                    <li key={file.id}>
                      <Link
                        to={`/files?file=${encodeURIComponent(file.id)}`}
                        className="os-focus-ring group flex items-center gap-3 rounded-[var(--radius-md)] p-2.5 transition-colors hover:bg-[var(--os-surface-hover)]"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)]">
                          {file.thumbnailUrl ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={file.name}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Icon size={18} className="text-[var(--os-accent)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-semibold text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
                            {file.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--os-text-muted)]">
                            {file.createdAt || 'Mới tải lên'}
                          </p>
                        </div>
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-[var(--os-text-subtle)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="border-t border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/50 px-5 py-3 text-center">
            <Link
              to="/files"
              className="os-focus-ring inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--os-accent)] hover:underline"
            >
              <span>Xem toàn bộ kho tài nguyên</span>
              <ArrowRight size={14} />
            </Link>
          </footer>
        </Card>
      </div>
    </motion.div>
  );
}
