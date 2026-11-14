import { Link, useNavigate } from "react-router";
import type { Product } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messageForError, messages } from "@/i18n/messages";
import { ProductForm } from "../components/ProductForm";
import { ProductGate } from "../components/ProductGate";
import { toUpdateBody } from "../payload";
import { useRestoreProduct, useUpdateProduct } from "../queries";

const t = messages.productForm;

function EditProduct({ product }: { product: Product }) {
  const navigate = useNavigate();
  const update = useUpdateProduct();
  const restore = useRestoreProduct();

  // An archived product is read-only until restored; restoring puts the fresh product in the cache and the form appears.
  if (!product.active) {
    return (
      <div role="status" className="mx-auto flex w-full max-w-2xl flex-col items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="font-semibold">{t.archivedBanner.title}</p>
        <p className="text-sm">{t.archivedBanner.description}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => restore.mutate(product.id)} disabled={restore.isPending}>
            {restore.isPending ? t.archivedBanner.restoring : t.archivedBanner.restore}
          </Button>
          <Link to="/products" className={buttonVariants({ variant: "outline" })}>
            {t.backToList}
          </Link>
        </div>
        {restore.isError && (
          <p role="alert" className="text-sm text-destructive">
            {messageForError(restore.error)}
          </p>
        )}
      </div>
    );
  }

  return (
    <ProductForm
      product={product}
      pending={update.isPending}
      submitLabel={t.saveChanges}
      onSubmit={(values, fail) =>
        update.mutate(
          { id: product.id, ...toUpdateBody(values) },
          { onSuccess: () => navigate("/products"), onError: fail },
        )
      }
    />
  );
}

export function EditProductPage() {
  return <ProductGate>{(product) => <EditProduct product={product} />}</ProductGate>;
}