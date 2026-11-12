import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { messageForError, messages } from "@/i18n/messages";
import { useArchiveRecipe } from "../queries";

export function ArchiveRecipeDialog({ recipe, onClose }: { recipe: { id: string; name: string } | null; onClose: () => void }) {
  const archive = useArchiveRecipe();
  const t = messages.recipes.archiveDialog;

  const confirm = () => {
    if (recipe) archive.mutate(recipe.id, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={recipe !== null}
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
        <p className="font-medium">{recipe?.name}</p>
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