// petite modale pour confirmer la suppression
import { useTheme } from "@/theme/useTheme";
import { Button, ModalShell } from "@/utils/UI";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const { textColor } = useTheme();

  return (
    <ModalShell
      title={title}
      onClose={onCancel}
      overlayClassName="items-center"
      className="w-full max-w-md rounded-xl p-6"
    >
      <p className="text-sm mb-6 whitespace-pre-line"
        style={{ color: textColor }}>
        {message}
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" size="sm" type="button" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
