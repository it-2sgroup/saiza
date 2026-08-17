"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import type { NewsPost } from "@/lib/admin/types";

export function NewsPageContent({ posts }: { posts: NewsPost[] }) {
  const { t } = useLanguage();

  return (
    <Container className="pt-32 pb-24">
      <div className="mb-12 flex max-w-[680px] flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{t.newsPage.eyebrow}</span>
        <h1 className="text-[clamp(34px,4vw,54px)] leading-[1.1] font-medium tracking-[-0.02em]">
          {t.newsPage.title}
        </h1>
      </div>
      {posts.length === 0 ? (
        <p className="text-ink-2">Chưa có bài viết nào.</p>
      ) : (
        <div className="flex flex-col">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/tin-tuc/${post.slug}`}
              className={`grid grid-cols-[220px_1fr] items-center gap-7 border-t border-line py-7 text-inherit ${
                i === posts.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[22px] bg-wash shadow-[0_10px_26px_rgba(22,33,62,0.06)]">
                {post.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-entered URL, any host
                  <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                {post.tag && (
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-2 uppercase">
                    {post.tag}
                  </span>
                )}
                <h3 className="text-[22px] leading-[1.3] font-semibold">{post.title}</h3>
                <p className="text-[15px] leading-[1.7] text-ink-2">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
