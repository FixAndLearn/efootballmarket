import { redirect } from "next/navigation";

export default function PoliciesIndexRedirect() {
  redirect("/terms");
}
