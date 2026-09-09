import { AnimatePresence } from 'framer-motion';
import CreateFolderModal from './CreateFolderModal';
import DeleteModal from './DeleteModal';
import AddLinkModal from './AddLinkModal';
import EditLinkModal from './EditLinkModal';
import PreviewModal from './PreviewModal';

export default function FileModals(props) {
  return (
    <AnimatePresence>
      {props.showFolderModal && <CreateFolderModal {...props} />}
      {props.fileToDelete && <DeleteModal {...props} />}
      {props.showLinkModal && <AddLinkModal {...props} />}
      {props.showEditLinkModal && <EditLinkModal {...props} />}
      {props.previewFile && <PreviewModal key={props.previewFile.id} {...props} />}
    </AnimatePresence>
  );
}
