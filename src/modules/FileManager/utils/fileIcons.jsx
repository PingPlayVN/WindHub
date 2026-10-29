import { FileText, Folder as FolderIcon, Globe, Image as ImageIcon, Music, Video } from 'lucide-react';

export function getFileIcon(type) {
  if (type === 'folder') return <FolderIcon size={40} className="text-amber-500 fill-amber-500/20" />;
  if (type === 'image') return <ImageIcon size={32} className="text-amber-500" />;
  if (type === 'video') return <Video size={32} className="text-purple-500" />;
  if (type === 'audio') return <Music size={32} className="text-pink-500" />;
  if (type === 'document') return <FileText size={32} className="text-orange-500" />;
  return <Globe size={32} className="text-slate-500" />;
}
