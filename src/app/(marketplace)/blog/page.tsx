import NewsFeedPage, { metadata as newsMetadata } from "../news/page";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  ...newsMetadata,
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/blog",
  },
};

export default NewsFeedPage;
