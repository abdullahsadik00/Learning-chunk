'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  category: z.enum(['tech', 'business', 'design']),
});

type ActionState = {
  errors?: { title?: string[]; content?: string[]; category?: string[] };
  success?: boolean;
  message?: string;
};

export async function createPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    category: formData.get('category') as string,
  };

  const result = CreatePostSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Simulate DB insert
  await new Promise((r) => setTimeout(r, 800));

  revalidatePath('/blog');
  revalidatePath('/day-20');
  return {
    success: true,
    message: `Post "${result.data.title}" created successfully!`,
  };
}

export async function toggleLike(
  postId: string,
): Promise<{ liked: boolean; likes: number }> {
  'use server';
  await new Promise((r) => setTimeout(r, 300));
  // Simulate toggle — in real app this hits DB
  void postId; // postId would be used in a real DB call
  return { liked: true, likes: Math.floor(Math.random() * 1000) };
}
