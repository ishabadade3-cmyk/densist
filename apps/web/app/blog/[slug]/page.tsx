import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BlogPostJsonLd } from "@/components/seo/json-ld";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return clinicContent.blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = clinicContent.blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  return {
    title: `${post.title} | Dental Health Education`,
    description: post.summary,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = clinicContent.blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const otherPosts = clinicContent.blogPosts.filter((p) => p.slug !== slug);

  return (
    <PublicShell>
      <BlogPostJsonLd
        title={post.title}
        description={post.summary}
        publishedAt={post.publishedAt}
        slug={post.slug}
      />

      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary mb-3">
            <Link href="/blog" className="hover:text-primary transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span>{post.category}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground max-w-4xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-6 pt-4 border-t border-border/80">
            <span>Published: {post.publishedAt}</span>
            <span>&bull;</span>
            <span>Read time: {post.readTime}</span>
            <span>&bull;</span>
            <span>
              Author: <TBDText value={post.authorName} fallbackKey="blog_content" className="font-medium text-foreground" />
            </span>
          </div>
        </Container>
      </section>

      {/* Article Body */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Main Article Content */}
            <article className="lg:col-span-8 flex flex-col gap-6">
              {/* Clinical Verification Callout */}
              <div className="p-4 sm:p-5 rounded-xl bg-accent/40 border border-border flex items-start gap-3">
                <span className="text-primary font-bold text-lg mt-0.5">✓</span>
                <div className="text-xs text-foreground leading-relaxed">
                  <span className="font-semibold text-primary">Medically Reviewed Article: </span>
                  This clinical guide was reviewed by{" "}
                  <TBDText value={post.clinicalReviewer} fallbackKey="blog_content" className="font-semibold" /> on{" "}
                  <span className="font-semibold">{post.reviewedDate}</span> in accordance with current dental literature.
                </div>
              </div>

              {/* Lead Summary */}
              <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed italic border-l-4 border-primary pl-4 my-2">
                {post.summary}
              </p>

              {/* Paragraphs */}
              <div className="flex flex-col gap-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {post.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Clinical Action Notice */}
              <div className="p-6 rounded-xl bg-card border border-border mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <h4 className="font-serif text-lg font-bold text-foreground">Experiencing Dental Symptoms?</h4>
                  <p className="text-xs text-muted-foreground">
                    Schedule a clinical diagnostic checkup with our specialist dental surgeons.
                  </p>
                </div>
                <Link href="/contact#book">
                  <Button variant="primary" size="md" className="shrink-0">
                    Book Examination
                  </Button>
                </Link>
              </div>
            </article>

            {/* Sidebar: Related Articles */}
            <aside className="lg:col-span-4 sticky top-28 flex flex-col gap-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Related Educational Guides</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 text-xs">
                  {otherPosts.map((other) => (
                    <div key={other.slug} className="pb-3 border-b border-border/60 last:border-0 last:pb-0">
                      <span className="text-[10px] font-semibold uppercase text-secondary tracking-wider">
                        {other.category}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-foreground mt-1 hover:text-primary transition-colors">
                        <Link href={`/blog/${other.slug}`}>
                          {other.title}
                        </Link>
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {other.summary}
                      </p>
                    </div>
                  ))}
                  <Link href="/blog" className="text-xs font-semibold text-primary hover:underline pt-2">
                    ← Back to Blog Index
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
