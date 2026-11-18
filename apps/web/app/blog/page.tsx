import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "Dental Health Blog & Oral Hygiene Education | Clinical Insights",
  description:
    "Evidence-based oral health articles, root canal facts, clear aligner guides, and periodontal prevention protocols reviewed by specialist clinicians.",
};

export default function BlogListPage() {
  const { blogPosts } = clinicContent;

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Patient Education &amp; Clinical Knowledge
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Dental Health Blog
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Objective, clinician-reviewed educational guides to help you understand treatments,
            prevent oral pathology, and make informed decisions about your dental health.
          </p>
        </Container>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.slug} variant="elevated" className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                    <span>{post.category}</span>
                    <span className="text-muted-foreground font-normal lowercase">{post.readTime}</span>
                  </div>
                  <CardTitle className="font-serif text-xl sm:text-2xl text-foreground hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-sm mt-3 leading-relaxed">
                    {post.summary}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground/80 flex flex-col gap-1 py-3 border-t border-border/60">
                    <p>Clinical Reviewer: <TBDText value={post.clinicalReviewer} fallbackKey="blog_content" /></p>
                    <p>Reviewed on: {post.reviewedDate}</p>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Published: {post.publishedAt}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Read Article &rarr;
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
