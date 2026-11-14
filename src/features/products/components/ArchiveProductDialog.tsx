import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { messageForError, messages } from "@/i18n/messages";
import { useArchiveProduct } from "../queries";

export function ArchiveProductDialog({ product, onClose }: { product: { id: string; name: string } | null; onClose: () => void }) {
  const archive = useArchiveProduct();
  const t = messages.products.archiveDialog;

  const confirm = () => {
    if (product) archive.mutate(product.id, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={product !== null}
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
        <p className="font-medium">{product?.name}</p>
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