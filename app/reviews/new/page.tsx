import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthCard";
import { ReviewForm } from "@/components/forms/ReviewForm";

export const metadata: Metadata = { title: "Leave a review", alternates: { canonical: "/reviews/new" } };

export default function NewReviewPage() {
  return (
    <AuthCard title="Leave a review" subtitle="Tried our bakes? We'd love to know what you thought.">
      <ReviewForm />
    </AuthCard>
  );
}
