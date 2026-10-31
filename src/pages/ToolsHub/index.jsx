import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';
import ToolCard from './components/ToolCard';
import ToolDialog from './components/ToolDialog';
import ToolShareDialog from './components/ToolShareDialog';
import { toolEntries } from './toolRegistry';

export default function ToolsHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState(null);
  const [sharingTool, setSharingTool] = useState(null);

  // Tự động mở công cụ khi truy cập qua liên kết chia sẻ trực tiếp (ví dụ: /tools?toolId=Casio580Spell)
  useEffect(() => {
    const toolParam = searchParams.get('toolId') || searchParams.get('tool');
    if (!toolParam) {
      setSelectedTool((current) => (current ? null : current));
      return;
    }

    const matched = toolEntries.find(
      (t) => t.id.toLowerCase() === toolParam.toLowerCase()
    );

    if (matched) {
      if (matched.isLocked) {
        toast.warning(matched.lockReason || 'Công cụ này hiện đang khóa.');
        setSelectedTool(null);
      } else {
        setSelectedTool(matched);
      }
    } else {
      toast.error(`Không tìm thấy công cụ "${toolParam}"`);
      setSelectedTool(null);
    }
  }, [searchParams]);

  const handleOpenTool = (tool) => {
    if (tool?.isDirectLink && tool?.link) {
      navigate(tool.link);
      return;
    }
    if (tool.isLocked) {
      toast.warning(tool.lockReason || 'Công cụ này hiện đang khóa.');
      return;
    }
    setSelectedTool(tool);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('toolId', tool.id);
    setSearchParams(nextParams);
  };

  const handleCloseTool = () => {
    setSelectedTool(null);
    const nextParams = new URLSearchParams(searchParams);
    if (nextParams.has('toolId') || nextParams.has('tool')) {
      nextParams.delete('toolId');
      nextParams.delete('tool');
      setSearchParams(nextParams);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-full space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-500">windhub // tools</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Công cụ</h1>
        </div>
        <span className="font-mono text-xs text-slate-500">{toolEntries.length.toString().padStart(2, '0')} công cụ</span>
      </section>

      {toolEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {toolEntries.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index}
              onOpen={() => handleOpenTool(tool)}
              onShare={(t) => setSharingTool(t)}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center dark:border-slate-700">
          <Wrench className="mb-3 text-slate-400" size={28} />
          <p className="font-mono text-sm text-slate-500">Chưa có công cụ nào.</p>
        </div>
      )}

      {selectedTool && (
        <ToolDialog
          tool={selectedTool}
          onClose={handleCloseTool}
          onShare={(t) => setSharingTool(t)}
        />
      )}

      {sharingTool && (
        <ToolShareDialog
          tool={sharingTool}
          onClose={() => setSharingTool(null)}
        />
      )}
    </motion.div>
  );
}