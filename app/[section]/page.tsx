import type { Metadata } from "next";
import { SectionPage } from "../components/Section";
import { SECTION_IDS, SECTIONS, type SectionId } from "../lib/news";

type Props = { params: Promise<{ section: string }> };

// Anything other than the four sections is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const { seoTitle, seoDescription } = SECTIONS[section as SectionId];
  return { title: seoTitle, description: seoDescription, alternates: { canonical: `/${section}` } };
}

export default async function Page({ params }: Props) {
  const { section } = await params;
  return <SectionPage id={section as SectionId} />;
}
