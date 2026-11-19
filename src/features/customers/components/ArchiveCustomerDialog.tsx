import { useState } from "react";
import type { Customer } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { messageForError, messages } from "@/i18n/messages";
import { useArchiveCustomer, useRestoreCustomer } from "../queries";

export function ArchiveCustomerDialog({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const archive = useArchiveCustomer();
  const restore = useRestoreCustomer();
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const t = messages.customers.archiveDialog;
  const isRestoring = customer !== null && !customer.active;
  const pending = archive.isPending || restore.isPending;
  const errorMessage = isRestoring ? restoreError : archive.isError ? messageForError(archive.error) : null;
  const confirmLabel = isRestoring ? messages.customers.actions.restore : t.confirm;
  const pendingLabel = isRestoring ? t.restoring : t.archiving;

  const confirm = () => {
    if (!customer) return;
    if (isRestoring) {
      setRestoreError(null);
      restore.mutate(customer.id, { onSuccess: onClose, onError: (error) => setRestoreError(messageForError(error)) });
    } else {
      archive.mutate(customer.id, { onSuccess: onClose });
    }
  };

  return (
    <Dialog
      open={customer !== null}
      onOpenChange={(open) => {
        if (!open) {
          archive.reset();
          restore.reset();
          setRestoreError(null);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>{isRestoring ? messages.customers.actions.restore : t.title}</DialogTitle>
        <DialogDescription>
          {isRestoring ? messages.customerForm.archivedBanner.description : t.description}
        </DialogDescription>
        <p className="font-medium">{customer?.name}</p>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t.cancel}
          </Button>
          <Button onClick={confirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
