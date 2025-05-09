import { Edit, EyeIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollectionActionButtonsProps {
  collectionId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onPreview: () => void;
  activitiesCount: number;
  isGridView?: boolean;
}

export function CollectionActionButtons({
  collectionId,
  onEdit,
  onDelete,
  onView,
  onPreview,
  activitiesCount,
  isGridView = false
}: CollectionActionButtonsProps) {
  const buttonSize = isGridView ? "sm" : "default";
  const iconSize = isGridView ? 14 : 16;

  return (
    <div className={`flex ${isGridView ? 'gap-1 flex-wrap' : 'gap-3'}`}>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => onView(collectionId)}
        className={`${isGridView ? 'text-xs h-7 px-2' : ''}`}
      >
        <EyeIcon className={`mr-1 h-${iconSize / 4} w-${iconSize / 4}`} />
        {!isGridView && "View"}
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => onEdit(collectionId)}
        className={`${isGridView ? 'text-xs h-7 px-2' : ''}`}
      >
        <Edit className={`mr-1 h-${iconSize / 4} w-${iconSize / 4}`} />
        {!isGridView && "Edit"}
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => onDelete(collectionId)}
        className={`${isGridView ? 'text-xs h-7 px-2' : ''} text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20`}
      >
        <Trash2 className={`mr-1 h-${iconSize / 4} w-${iconSize / 4}`} />
        {!isGridView && "Delete"}
      </Button>
    </div>
  );
}
