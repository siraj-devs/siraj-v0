import { notFound } from "next/navigation";

/** Internal rewrite target used when a public page is disabled. */
export default function ForceNotFoundPage() {
  notFound();
}
