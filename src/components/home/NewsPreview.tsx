"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import type { NewsPost } from "@/lib/admin/types";

export function NewsPreview({ posts }: { posts: NewsPost[] }) {
  const { t } = useLanguage();

  if (posts.length === 0) return null;

  return (
    <section className="border-t border-line bg-card">
      <Container className="py-30">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-[560px] flex-col gap-3.5">
            <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              {t.home.news.eyebrow}
            </span>
            <h2 className="text-[clamp(34px,4vw,56px)] leading-[1.06] font-medium tracking-[-0.028em]">
              {t.home.news.title}
            </h2>
          </div>
          <Link href="/tin-tuc" className="border-b border-line pb-1 text-[14.5px] font-semibold text-accent">
            {t.home.news.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5.5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/tin-tuc/${post.slug}`}
              className="flex flex-col gap-3.5 text-inherit transition-transform duration-400 ease-soft hover:-translate-y-1.5"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[22px] bg-wash shadow-[0_10px_28px_rgba(22,33,62,0.08)] transition-shadow duration-400 ease-soft hover:shadow-[0_18px_40px_rgba(22,33,62,0.16)]">
                {post.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-entered URL, any host
                  <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
                )}
              </div>
              {post.tag && (
                <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-2 uppercase">
                  {post.tag}
                </span>
              )}
              <h3 className="text-[16.5px] leading-[1.45] font-semibold">{post.title}</h3>
              <p className="text-sm leading-[1.65] text-ink-2">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
