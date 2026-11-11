import { redirect } from "next/navigation";

export default function BlogArticleRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/news/${params.slug}`);
}
