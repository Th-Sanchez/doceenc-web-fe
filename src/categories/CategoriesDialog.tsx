import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { messageForError, messages } from "@/i18n/messages";
import { useCreateCategory, useDeleteCategory, useIngredientCategories, useRenameCategory } from "./queries";

const t = messages.categoriesDialog;

export function CategoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const categories = useIngredientCategories(open);
  const create = useCreateCategory();
  const rename = useRenameCategory();
  const remove = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = (cause: unknown) => setError(messageForError(cause));

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (name === "") return;
    setError(null);
    create.mutate(name, { onSuccess: () => setNewName(""), onError: fail });
  };

  const onRename = (event: FormEvent) => {
    event.preventDefault();
    const name = editing?.name.trim();
    if (!editing || !name) return;
    setError(null);
    rename.mutate({ id: editing.id, name }, { onSuccess: () => setEditing(null), onError: fail });
  };

  const onDelete = (id: string) => {
    setError(null);
    remove.mutate(id, {
      onSuccess: () => setDeletingId(null),
      onError: (cause) => {
        fail(cause);
        setDeletingId(null);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setEditing(null);
          setDeletingId(null);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogTitle>{t.title}</DialogTitle>
        <DialogDescription>{t.description}</DialogDescription>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {categories.isPending && <p role="status">{messages.loading}</p>}
        {categories.isError && <p role="alert" className="text-sm text-destructive">{t.loadError}</p>}
        {categories.data?.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}

        <ul className="flex flex-col divide-y">
          {categories.data?.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-2 py-2">
              {editing?.id === category.id ? (
                <form onSubmit={onRename} className="flex w-full items-center gap-2">
                  <Input
                    aria-label={t.renameField(category.name)}
                    value={editing.name}
                    onChange={(event) => setEditing({ id: category.id, name: event.target.value })}
                    autoFocus
                  />
                  <Button type="submit" size="sm" disabled={rename.isPending}>
                    {t.save}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                    {t.cancel}
                  </Button>
                </form>
              ) : deletingId === category.id ? (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.confirmDelete}</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onDelete(category.id)} disabled={remove.isPending}>
                      {t.confirm}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="truncate">{category.name}</span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-9 px-0"
                      aria-label={t.rename(category.name)}
                      onClick={() => setEditing({ id: category.id, name: category.name })}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-9 px-0"
                      aria-label={t.delete(category.name)}
                      onClick={() => setDeletingId(category.id)}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={onCreate} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="new-category" className="text-sm font-medium">
              {t.newLabel}
            </label>
            <Input
              id="new-category"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t.newPlaceholder}
              maxLength={80}
            />
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t.adding : t.add}
          </Button>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t.close}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}