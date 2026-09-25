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
        <Button variant="secondary" type="button" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:opacity-90 transition"
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
