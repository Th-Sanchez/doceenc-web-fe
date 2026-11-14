import { useNavigate } from "react-router";
import { messages } from "@/i18n/messages";
import { ProductForm } from "../components/ProductForm";
import { toCreateBody } from "../payload";
import { useCreateProduct } from "../queries";

export function NewProductPage() {
  const navigate = useNavigate();
  const create = useCreateProduct();

  return (
    <ProductForm
      pending={create.isPending}
      submitLabel={messages.productForm.save}
      onSubmit={(values, fail) =>
        create.mutate(toCreateBody(values), { onSuccess: () => navigate("/products"), onError: fail })
      }
    />
  );
}