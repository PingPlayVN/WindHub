import CreateFolderModal from './CreateFolderModal';
import DeleteModal from './DeleteModal';
import AddLinkModal from './AddLinkModal';
import EditLinkModal from './EditLinkModal';
import PreviewModal from './PreviewModal';
import MoveToModal from './MoveToModal';
import { ShareDialog } from '../../features/FileSharing';

export default function FileModals(props) {
  return (
    <>
      <CreateFolderModal {...props} />
      <DeleteModal {...props} />
      <AddLinkModal {...props} />
      <EditLinkModal {...props} />
      {props.showMoveModal && <MoveToModal {...props} />}
      <PreviewModal {...props} />
      <ShareDialog
        item={props.shareItem}
        url={props.shareUrl}
        onClose={props.closeShareDialog}
        onCopy={props.copyShareUrl}
        onShare={props.shareNatively}
      />
    </>
  );
}
