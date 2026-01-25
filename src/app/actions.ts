"use server";

import { signOut } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logout() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
