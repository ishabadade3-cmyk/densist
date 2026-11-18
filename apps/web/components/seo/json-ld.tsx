import * as React from "react";
import { clinicContent } from "@/config/clinic-content";
import { isTBDValue } from "@/components/ui/tbd-badge";

/**
 * Verified-fields only JSON-LD Generator
 *
 * Anti-hallucination safeguard: Unverified TBD fields are strictly omitted
 * from schema.org structured data to prevent search engine indexing of invalid facts.
 */

export function DentalClinicJsonLd() {
  const { clinic } = clinicContent;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    url: "https://example-dental.in", // Placeholder domain until production deployment
  };

  if (!isTBDValue(clinic.brandName)) {
    schema.name = clinic.brandName;
  }

  if (!isTBDValue(clinic.legalName)) {
    schema.legalName = clinic.legalName;
  }

  if (!isTBDValue(clinic.phone)) {
    schema.telephone = clinic.phone;
  }

  if (!isTBDValue(clinic.email)) {
    schema.email = clinic.email;
  }

  // Address - verified fields only
  const hasVerifiedAddress =
    !isTBDValue(clinic.address.street) ||
    !isTBDValue(clinic.address.city) ||
    !isTBDValue(clinic.address.postalCode);

  if (hasVerifiedAddress) {
    const postalAddress: Record<string, string> = {
      "@type": "PostalAddress",
      addressCountry: clinic.address.country,
      addressRegion: clinic.address.state,
    };
    if (!isTBDValue(clinic.address.street)) postalAddress.streetAddress = clinic.address.street;
    if (!isTBDValue(clinic.address.city)) postalAddress.addressLocality = clinic.address.city;
    if (!isTBDValue(clinic.address.postalCode)) postalAddress.postalCode = clinic.address.postalCode;
    schema.address = postalAddress;
  }

  // Geo coordinates - verified fields only
  if (clinic.geo.latitude !== null && clinic.geo.longitude !== null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: clinic.geo.latitude,
      longitude: clinic.geo.longitude,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function MedicalServiceJsonLd({
  name,
  description,
  serviceType,
}: {
  name: string;
  description: string;
  serviceType: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name,
    description,
    procedureType: serviceType,
    bodyLocation: "Mouth",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQPageJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BlogPostJsonLd({
  title,
  description,
  publishedAt,
  slug,
}: {
  title: string;
  description: string;
  publishedAt: string;
  slug: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: title,
    description,
    datePublished: publishedAt,
    url: `https://example-dental.in/blog/${slug}`,
    medicalAudience: "Patient",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
