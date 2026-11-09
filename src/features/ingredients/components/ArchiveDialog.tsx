import type { Ingredient } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { messageForError, messages } from "@/i18n/messages";
import { useArchiveIngredient } from "../queries";

export function ArchiveDialog({ ingredient, onClose }: { ingredient: Ingredient | null; onClose: () => void }) {
  const archive = useArchiveIngredient();
  const t = messages.ingredients.archiveDialog;

  const confirm = () => {
    if (ingredient) archive.mutate(ingredient.id, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={ingredient !== null}
      onOpenChange={(open) => {
        if (!open) {
          archive.reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>{t.title}</DialogTitle>
        <DialogDescription>{t.description}</DialogDescription>
        <p className="font-medium">{ingredient?.name}</p>
        {archive.isError && (
          <p role="alert" className="text-sm text-destructive">
            {messageForError(archive.error)}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={archive.isPending}>
            {t.cancel}
          </Button>
          <Button onClick={confirm} disabled={archive.isPending}>
            {archive.isPending ? t.archiving : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}