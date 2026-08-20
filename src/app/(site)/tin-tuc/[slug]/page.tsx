import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import type { NewsPost } from "@/lib/admin/types";
import { getDictionary } from "@/lib/content/site-text";

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as NewsPost | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post, dict] = await Promise.all([getPost(slug), getDictionary("vi")]);
  return { title: post ? `${post.title} | SAIZA` : dict.newsPage.postFallbackTitle };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <Container className="max-w-[760px] pt-32 pb-24">
      {post.tag && (
        <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{post.tag}</span>
      )}
      <h1 className="mt-3 text-[clamp(30px,4vw,48px)] leading-[1.15] font-medium tracking-[-0.02em]">{post.title}</h1>
      {post.published_at && (
        <p className="mt-3 text-sm text-ink-2">{new Date(post.published_at).toLocaleDateString("vi-VN")}</p>
      )}
      {post.cover_image && (
        <div className="mt-8 aspect-[16/9] overflow-hidden rounded-card bg-wash">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered URL, any host */}
          <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="mt-8 flex flex-col gap-5 text-[16.5px] leading-[1.85] whitespace-pre-line text-ink-2">
        {post.body}
      </div>
    </Container>
  );
}
