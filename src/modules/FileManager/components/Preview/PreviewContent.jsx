import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Music } from 'lucide-react';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import Loader from '@/components/ui/Loader';
import { generateAndSaveVideoThumbnail } from '@/services/thumbnail';

function LoadingState({ label = 'Đang chuẩn bị nội dung xem trước...' }) {
  return <Loader text={label} size="md" />;
}

function UnavailablePreview({ url, isLocked, message = 'Định dạng này chưa hỗ trợ xem trước trực tiếp.' }) {
  return <div className="m-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-300"><div className="rounded-2xl bg-primary-500/10 p-4 text-primary-400"><FileText size={40} /></div><div><p className="font-medium text-white">Không thể xem trước</p><p className="mt-2 text-sm leading-6 text-slate-400">{message}</p></div>{url && !isLocked && <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500"><ExternalLink size={17} /> Mở hoặc tải tệp</a>}</div>;
}

function LocalTextViewer({ url }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error();
      return response.text();
    }).then(setContent).catch((reason) => {
      if (reason.name !== 'AbortError') setError('Không thể đọc nội dung tệp này.');
    });
    return () => controller.abort();
  }, [url]);
  if (error) return <LoadingState label={error} />;
  if (content === null) return <LoadingState />;
  return <pre className="min-h-full whitespace-pre-wrap break-words bg-white p-5 font-mono text-sm leading-6 text-slate-800">{content}</pre>;
}

function LocalDocxViewer({ url }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error();
      return response.arrayBuffer();
    }).then((arrayBuffer) => mammoth.extractRawText({ arrayBuffer })).then(({ value }) => {
      setContent(value || 'Tệp không có nội dung văn bản để hiển thị.');
    }).catch((reason) => {
      if (reason.name !== 'AbortError') setError('Không thể đọc tệp DOCX này.');
    });
    return () => controller.abort();
  }, [url]);
  if (error) return <LoadingState label={error} />;
  if (content === null) return <LoadingState />;
  return <article className="min-h-full bg-white px-6 py-8 text-[15px] leading-7 text-slate-800 sm:px-10"><div className="mx-auto max-w-3xl whitespace-pre-wrap break-words">{content}</div></article>;
}

function LocalSpreadsheetViewer({ url }) {
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error();
      return response.arrayBuffer();
    }).then((arrayBuffer) => {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error();
      return XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }).slice(0, 500);
    }).then(setSheet).catch((reason) => {
      if (reason.name !== 'AbortError') setError('Không thể đọc bảng tính này.');
    });
    return () => controller.abort();
  }, [url]);
  if (error) return <LoadingState label={error} />;
  if (sheet === null) return <LoadingState />;
  if (!sheet.length) return <LoadingState label="Bảng tính chưa có dữ liệu." />;
  return <div className="min-h-full overflow-auto bg-white p-3"><table className="min-w-full border-collapse text-left text-sm text-slate-800"><tbody>{sheet.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex === 0 ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}>{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-80 border border-slate-200 px-3 py-2 align-top break-words">{String(cell)}</td>)}</tr>)}</tbody></table></div>;
}

function LocalPptxViewer({ url }) {
  const [slides, setSlides] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error();
      return response.arrayBuffer();
    }).then((arrayBuffer) => JSZip.loadAsync(arrayBuffer)).then(async (archive) => {
      const slideFiles = Object.keys(archive.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((first, second) => Number(first.match(/\d+/)?.[0]) - Number(second.match(/\d+/)?.[0]));
      const parsedSlides = await Promise.all(slideFiles.map(async (path, index) => {
        const xml = await archive.file(path).async('text');
        const document = new DOMParser().parseFromString(xml, 'application/xml');
        const text = Array.from(document.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't')).map((node) => node.textContent).filter(Boolean).join(' ');
        return { number: index + 1, text: text || 'Slide không có văn bản.' };
      }));
      if (!parsedSlides.length) throw new Error();
      return parsedSlides;
    }).then(setSlides).catch((reason) => {
      if (reason.name !== 'AbortError') setError('Không thể đọc tệp PPTX này.');
    });
    return () => controller.abort();
  }, [url]);
  if (error) return <LoadingState label={error} />;
  if (slides === null) return <LoadingState />;
  return <div className="min-h-full space-y-5 bg-slate-100 p-4 sm:p-8">{slides.map((slide) => <section key={slide.number} className="mx-auto flex aspect-video max-w-4xl flex-col justify-center overflow-auto rounded-xl bg-white p-7 shadow-sm sm:p-12"><span className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary-600">Slide {slide.number}</span><p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-slate-800 sm:text-2xl">{slide.text}</p></section>)}</div>;
}

function LocalDocumentViewer({ url, extension }) {
  if (extension === 'pdf') return <PDFViewer config={{ src: url, theme: { preference: 'dark' }, tabBar: 'never' }} className="h-full w-full" style={{ height: '100%', width: '100%' }} />;
  if (extension === 'docx') return <LocalDocxViewer key={url} url={url} />;
  if (['xlsx', 'xls', 'csv'].includes(extension)) return <LocalSpreadsheetViewer key={url} url={url} />;
  if (extension === 'pptx') return <LocalPptxViewer key={url} url={url} />;
  return <LocalTextViewer key={url} url={url} />;
}

export default function PreviewContent({ previewFile, viewerEngine, setViewerEngine }) {
  const [mediaError, setMediaError] = useState(false);
  const { type, url, name, isLocked } = previewFile;
  const isGDrive = url.includes('drive.google.com') || url.includes('docs.google.com');

  if (type !== 'document' && type !== 'image' && type !== 'video' && type !== 'audio') return <UnavailablePreview url={url} isLocked={isLocked} />;
  if (isGDrive && (type === 'image' || type === 'video')) return <div className="flex h-full w-full flex-col p-4 sm:p-5"><div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-inner"><iframe src={url} className="absolute inset-0 h-full w-full border-0 bg-[#f9fafb] dark:bg-black" allow="autoplay; fullscreen" title="Google Drive Preview" /></div></div>;
  if (type === 'image') return mediaError ? <UnavailablePreview url={url} isLocked={isLocked} message="Không thể tải hình ảnh." /> : <img key={url} src={url} alt={name} onError={() => setMediaError(true)} className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-[0_0_30px_rgba(0,0,0,0.5)]" />;
  if (type === 'video') return mediaError ? <UnavailablePreview url={url} isLocked={isLocked} message="Không thể tải video." /> : <video src={url} controls autoPlay crossOrigin="anonymous" onError={() => setMediaError(true)} onLoadedData={(event) => { if (!previewFile.thumbnailUrl) { const video = event.target; setTimeout(() => { try { const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = (video.videoHeight / video.videoWidth) * 320; canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => { if (blob) generateAndSaveVideoThumbnail(previewFile.id, blob); }, 'image/jpeg', 0.7); } catch { console.log('Lỗi tạo thumbnail nội bộ'); } }, 1000); } }} className="max-h-[75vh] w-full rounded-xl bg-black outline-none" />;
  if (type === 'audio') return <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#111] p-12 shadow-2xl"><div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary-500/20 text-primary-500"><Music size={48} /></div><audio src={url} controls autoPlay className="w-full" /></div>;

  const extension = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
  const locallySupported = ['pdf', 'txt', 'docx', 'xlsx', 'xls', 'csv', 'pptx'].includes(extension);
  const activeEngine = (isGDrive && viewerEngine === 'microsoft') ? 'gdrive' : viewerEngine;
  const localName = extension === 'docx' ? 'Trình xem DOCX' : ['xlsx', 'xls', 'csv'].includes(extension) ? 'Bảng tính Excel' : extension === 'pptx' ? 'Slide Trình chiếu' : extension === 'pdf' ? 'PDF Viewer' : 'Trình xem Nội bộ';
  const frameUrl = activeEngine === 'google' ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

  return <div className="flex h-full w-full flex-col p-4 sm:p-5"><div className="mb-3 flex shrink-0 flex-wrap justify-end gap-2">{isGDrive ? <button type="button" className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-primary-600/30">Google Drive Preview</button> : <>{locallySupported && <button type="button" onClick={() => setViewerEngine('local')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeEngine === 'local' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{localName}</button>}<button type="button" onClick={() => setViewerEngine('microsoft')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeEngine === 'microsoft' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Microsoft Viewer</button><button type="button" onClick={() => setViewerEngine('google')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeEngine === 'google' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Google Viewer</button></>}</div><div className="relative min-h-0 w-full flex-1 overflow-auto rounded-xl border border-white/5 bg-[#0a0a0a] shadow-inner">{activeEngine === 'gdrive' ? <iframe src={url} className="absolute inset-0 h-full w-full border-0 bg-[#f9fafb] dark:bg-black" allow="autoplay; fullscreen" title="Google Drive Preview" /> : activeEngine === 'local' && locallySupported ? <LocalDocumentViewer url={url} extension={extension} /> : <iframe key={`${activeEngine}-${url}`} src={frameUrl} className="h-full w-full border-0 bg-white" title="Xem trước tài liệu" />}</div></div>;
}
