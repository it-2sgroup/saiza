export type PostStatus = "draft" | "published";
export type JobStatus = "draft" | "open" | "closed";
export type ContactStatus = "new" | "contacted" | "archived";

export type NewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  tag: string | null;
  status: PostStatus;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobPost = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string;
  requirements: string;
  benefits: string;
  salary_note: string | null;
  status: JobStatus;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  region: string | null;
  message: string | null;
  status: ContactStatus;
  created_at: string;
};
