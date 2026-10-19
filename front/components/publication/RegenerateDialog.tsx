"use client";

import { Warning } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface RegenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RegenerateDialog({ open, onClose, onConfirm }: RegenerateDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/12 text-amber-600">
          <Warning weight="fill" className="size-[18px]" />
        </span>
      }
      title="Сгенерировать статью заново?"
      description="Текущая версия статьи может быть заменена."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Отмена
          </Button>
          <Button onClick={onConfirm}>Сгенерировать заново</Button>
        </>
      }
    />
  );
}
