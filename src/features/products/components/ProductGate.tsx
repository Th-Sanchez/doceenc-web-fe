import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "@/api/problem";
import type { Product } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messages } from "@/i18n/messages";
import { useProduct } from "../queries";

/** Loads the product of the route and handles loading, failure and "not found" for every page that needs it. */
export function ProductGate({ children }: { children: (product: Product) => ReactNode }) {
  const { id } = useParams();
  const query = useProduct(id);

  if (query.isPending) return <p role="status">{messages.loading}</p>;

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.code === "PRODUCT_NOT_FOUND") {
      return (
        <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{messages.productForm.notFound}</p>
          <Link to="/products" className={buttonVariants({ variant: "outline" })}>
            {messages.productForm.backToList}
          </Link>
        </div>
      );
    }
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
        <p>{messages.products.loadError}</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          {messages.products.retry}
        </Button>
      </div>
    );
  }

  return <>{children(query.data)}</>;
}