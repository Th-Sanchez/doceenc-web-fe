import { Package } from "lucide-react";
import macaronsImage from "@/assets/orders/macarons.jpeg";
import browniesImage from "@/assets/orders/brownies.jpeg";
import volcanoCakeImage from "@/assets/orders/bolo-vulcao.jpeg";

export function OrderProductImage({ name, className = "" }: { name: string; className?: string }) {
  const normalized = name.toLocaleLowerCase();
  const image = normalized.includes("macaron") ? macaronsImage
    : normalized.includes("brownie") ? browniesImage
    : normalized.includes("vulc") ? volcanoCakeImage
    : null;

  return image ? (
    <img src={image} alt="" className={`size-12 shrink-0 rounded-lg object-cover ${className}`} />
  ) : (
    <span aria-hidden className={`flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#f7efeb] text-primary ${className}`}>
      <Package className="size-5" />
    </span>
  );
}
