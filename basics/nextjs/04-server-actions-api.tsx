// ═══════════════════════════════════════════════════════════════
// NEXT.JS 04: SERVER ACTIONS & ROUTE HANDLERS  (Day 20b)
// ═══════════════════════════════════════════════════════════════
//
// TWO WAYS TO RUN SERVER CODE FROM THE CLIENT:
//
//  Server Actions  — functions marked 'use server', called like
//                    regular async functions from Client Components
//                    or bound to <form action={}>. No API route needed.
//
//  Route Handlers  — app/api/**/route.ts files that export HTTP
//                    method functions (GET, POST, PUT, DELETE).
//                    Traditional REST API approach.

import React, { useState, useRef, useEffect } from 'react';

// ───────────────────────────────────────────────────────────────
// 1. SERVER ACTIONS — BASICS
// ───────────────────────────────────────────────────────────────
//
// Mark a file or function with 'use server' to run it on the server.
// Server Actions:
//   ✅ Can access DB directly
//   ✅ Can use server-only env vars
//   ✅ Called from Client Components like regular async functions
//   ✅ Work without JavaScript (progressive enhancement via <form>)
//   ✅ Automatic revalidation hooks (revalidatePath, revalidateTag)
//
// // actions/posts.ts
// 'use server';   ← file-level directive — everything here is server-only
//
// import { db } from '@/lib/db';
// import { revalidatePath } from 'next/cache';
// import { z } from 'zod';
//
// const CreatePostSchema = z.object({
//     title:   z.string().min(1).max(100),
//     content: z.string().min(10),
// });
//
// export async function createPost(formData: FormData) {
//     const parsed = CreatePostSchema.safeParse({
//         title:   formData.get('title'),
//         content: formData.get('content'),
//     });
//
//     if (!parsed.success) {
//         return { errors: parsed.error.flatten().fieldErrors };
//     }
//
//     await db.post.create({ data: parsed.data });
//     revalidatePath('/posts');          // purge the /posts cache
//
//     return { success: true };
// }

// ── 1a. Server Action with a plain HTML form (progressive enhancement) ──
//
// // app/posts/new/page.tsx  (Server Component)
// import { createPost } from '@/actions/posts';
//
// export default function NewPostPage() {
//     return (
//         <form action={createPost}>           {/* works without JS! */}
//             <input  name="title"   required />
//             <textarea name="content" required />
//             <button type="submit">Publish</button>
//         </form>
//     );
// }

// ───────────────────────────────────────────────────────────────
// 2. useFormState + useFormStatus  (Client Components)
// ───────────────────────────────────────────────────────────────
//
// useFormState  — holds the Server Action's return value (errors, success)
// useFormStatus — gives pending state INSIDE the form (must be a child component)
//
// // components/CreatePostForm.tsx
// 'use client';
// import { useFormState, useFormStatus } from 'react-dom';
// import { createPost } from '@/actions/posts';
//
// function SubmitButton() {
//     const { pending } = useFormStatus();
//     return (
//         <button type="submit" disabled={pending}>
//             {pending ? 'Publishing…' : 'Publish'}
//         </button>
//     );
// }
//
// export function CreatePostForm() {
//     const [state, formAction] = useFormState(createPost, {});
//
//     return (
//         <form action={formAction}>
//             <input name="title" />
//             {state.errors?.title && <p className="error">{state.errors.title[0]}</p>}
//
//             <textarea name="content" />
//             {state.errors?.content && <p className="error">{state.errors.content[0]}</p>}
//
//             {state.success && <p className="success">Post published!</p>}
//             <SubmitButton />
//         </form>
//     );
// }

// ── Teaching version: Controlled form with validation state ──
interface FormErrors { title?: string[]; content?: string[]; _form?: string[]; }
interface FormState  { errors?: FormErrors; success?: boolean; }

function CreatePostForm() {
    const [state, setState] = useState<FormState>({});
    const [pending, setPending] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPending(true);
        const fd = new FormData(e.currentTarget);
        const title   = (fd.get('title')   as string ?? '').trim();
        const content = (fd.get('content') as string ?? '').trim();

        const errors: FormErrors = {};
        if (!title)           errors.title   = ['Title is required'];
        if (content.length < 10) errors.content = ['At least 10 characters'];

        if (Object.keys(errors).length > 0) {
            setState({ errors });
        } else {
            setState({ success: true });
            formRef.current?.reset();
        }
        setPending(false);
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            {state.success && <p style={{ color: 'green' }}>Post published!</p>}

            <div>
                <label htmlFor="title">Title</label>
                <input id="title" name="title" />
                {state.errors?.title && <p style={{ color: 'red' }}>{state.errors.title[0]}</p>}
            </div>

            <div>
                <label htmlFor="content">Content</label>
                <textarea id="content" name="content" rows={4} />
                {state.errors?.content && <p style={{ color: 'red' }}>{state.errors.content[0]}</p>}
            </div>

            <button type="submit" disabled={pending}>
                {pending ? 'Publishing…' : 'Publish'}
            </button>
        </form>
    );
}

// ───────────────────────────────────────────────────────────────
// 3. useOptimistic — OPTIMISTIC UI
// ───────────────────────────────────────────────────────────────
//
// Update the UI immediately before the server confirms — roll back if it fails.
//
// // components/LikeButton.tsx  ('use client')
// 'use client';
// import { useOptimistic, useTransition } from 'react';
// import { toggleLike } from '@/actions/likes';
//
// export function LikeButton({
//     postId, initialLikes, initialLiked
// }: { postId: string; initialLikes: number; initialLiked: boolean }) {
//     const [isPending, startTransition] = useTransition();
//     const [opt, addOptimistic] = useOptimistic(
//         { likes: initialLikes, liked: initialLiked },
//         (state, newLiked: boolean) => ({
//             likes: newLiked ? state.likes + 1 : state.likes - 1,
//             liked: newLiked,
//         })
//     );
//
//     const handleClick = () => {
//         startTransition(async () => {
//             addOptimistic(!opt.liked);     // immediate — no server wait
//             await toggleLike(postId);      // real call — may fail
//         });
//     };
//
//     return (
//         <button onClick={handleClick} disabled={isPending}>
//             {opt.liked ? '❤️' : '🤍'} {opt.likes}
//         </button>
//     );
// }

// ── Teaching version: LikeButton without Next.js Server Action dependency ──
function LikeButton({
    initialLikes,
    initialLiked,
    onToggle,
}: {
    initialLikes: number;
    initialLiked: boolean;
    onToggle?: (liked: boolean) => Promise<void>;
}) {
    const [liked, setLiked] = useState(initialLiked);
    const [likes, setLikes] = useState(initialLikes);
    const [pending, setPending] = useState(false);

    const handleClick = async () => {
        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikes(l => newLiked ? l + 1 : l - 1);

        setPending(true);
        try {
            await onToggle?.(newLiked);
        } catch {
            // Roll back on failure
            setLiked(liked);
            setLikes(l => newLiked ? l - 1 : l + 1);
        }
        setPending(false);
    };

    return (
        <button onClick={handleClick} disabled={pending}>
            {liked ? '❤️' : '🤍'} {likes}
        </button>
    );
}

// ───────────────────────────────────────────────────────────────
// 4. ROUTE HANDLERS — REST API ENDPOINTS
// ───────────────────────────────────────────────────────────────
//
// app/api/**/route.ts files export named HTTP method functions.
// No default export — each export IS the handler.
//
// // app/api/posts/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db';
//
// export async function GET(request: NextRequest) {
//     const { searchParams } = new URL(request.url);
//     const page  = Number(searchParams.get('page')  ?? 1);
//     const limit = Number(searchParams.get('limit') ?? 10);
//
//     const [posts, total] = await Promise.all([
//         db.post.findMany({ skip: (page - 1) * limit, take: limit }),
//         db.post.count(),
//     ]);
//
//     return NextResponse.json({ posts, total, page, limit });
// }
//
// export async function POST(request: NextRequest) {
//     const body = await request.json();
//
//     const post = await db.post.create({ data: body });
//     return NextResponse.json(post, { status: 201 });
// }

// ── 4a. Dynamic route handler (app/api/posts/[id]/route.ts) ──
//
// interface RouteContext { params: { id: string }; }
//
// export async function GET(_req: NextRequest, { params }: RouteContext) {
//     const post = await db.post.findUnique({ where: { id: params.id } });
//     if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
//     return NextResponse.json(post);
// }
//
// export async function PUT(request: NextRequest, { params }: RouteContext) {
//     const data = await request.json();
//     const post = await db.post.update({ where: { id: params.id }, data });
//     return NextResponse.json(post);
// }
//
// export async function DELETE(_req: NextRequest, { params }: RouteContext) {
//     await db.post.delete({ where: { id: params.id } });
//     return new Response(null, { status: 204 });
// }

// ── 4b. Auth-wrapper higher-order function ──
//
// // lib/api-helpers.ts
// import { auth } from '@/auth';
// import { NextRequest, NextResponse } from 'next/server';
//
// export function withAuth(
//     handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
// ) {
//     return async (req: NextRequest) => {
//         const session = await auth();
//         if (!session?.user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }
//         return handler(req, session.user);
//     };
// }
//
// // app/api/me/route.ts
// import { withAuth } from '@/lib/api-helpers';
//
// export const GET = withAuth(async (_req, user) => {
//     return NextResponse.json({ id: user.id, name: user.name });
// });

// ───────────────────────────────────────────────────────────────
// 5. STREAMING RESPONSES  (SSE / AI)
// ───────────────────────────────────────────────────────────────
//
// // app/api/stream/route.ts
// export async function GET() {
//     const encoder = new TextEncoder();
//
//     const stream = new ReadableStream({
//         async start(controller) {
//             for (let i = 0; i < 5; i++) {
//                 controller.enqueue(encoder.encode(`data: ${JSON.stringify({ i })}\n\n`));
//                 await new Promise(r => setTimeout(r, 500));
//             }
//             controller.close();
//         },
//     });
//
//     return new Response(stream, {
//         headers: {
//             'Content-Type':  'text/event-stream',
//             'Cache-Control': 'no-cache',
//             'Connection':    'keep-alive',
//         },
//     });
// }
//
// // Client side — consume with EventSource:
// const es = new EventSource('/api/stream');
// es.onmessage = e => console.log(JSON.parse(e.data));

// ───────────────────────────────────────────────────────────────
// 6. WEBHOOKS
// ───────────────────────────────────────────────────────────────
//
// Webhooks receive data from external services (Stripe, GitHub…).
// Key: verify the signature BEFORE doing anything with the payload.
//
// // app/api/webhooks/stripe/route.ts
// import Stripe from 'stripe';
// import { headers } from 'next/headers';
//
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//
// export async function POST(request: Request) {
//     const body      = await request.text();         // must be raw string
//     const signature = headers().get('stripe-signature')!;
//
//     let event: Stripe.Event;
//     try {
//         event = stripe.webhooks.constructEvent(
//             body, signature, process.env.STRIPE_WEBHOOK_SECRET!
//         );
//     } catch {
//         return Response.json({ error: 'Invalid signature' }, { status: 400 });
//     }
//
//     switch (event.type) {
//         case 'checkout.session.completed':
//             await handlePayment(event.data.object as Stripe.Checkout.Session);
//             break;
//         default:
//             console.log('Unhandled event:', event.type);
//     }
//
//     return Response.json({ received: true });
// }

// ── File upload with Server Action ──
//
// // actions/upload.ts  ('use server')
// export async function uploadImage(formData: FormData) {
//     const file = formData.get('file') as File;
//
//     if (!file || file.size === 0) return { error: 'No file' };
//     if (file.size > 5 * 1024 * 1024) return { error: 'Max 5MB' };
//
//     const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
//     if (!validTypes.includes(file.type)) return { error: 'Invalid type' };
//
//     const buffer   = Buffer.from(await file.arrayBuffer());
//     const filename = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
//
//     await writeFile(join(process.cwd(), 'public/uploads', filename), buffer);
//     return { success: true, url: `/uploads/${filename}` };
// }

// ── Teaching version: ImageUpload client component ──
function ImageUpload({ onUpload }: { onUpload?: (url: string) => void }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus]   = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { setStatus('error'); return; }

        const reader = new FileReader();
        reader.onload = ev => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        setStatus('uploading');
        // In a real app: const fd = new FormData(); fd.append('file', file); uploadImage(fd);
        setTimeout(() => { setStatus('done'); onUpload?.('/uploads/fake.png'); }, 800);
    };

    return (
        <div>
            <input ref={inputRef} type="file" accept="image/*"
                   style={{ display: 'none' }} onChange={handleChange} />
            <button onClick={() => inputRef.current?.click()} disabled={status === 'uploading'}>
                {status === 'uploading' ? 'Uploading…' : 'Select Image'}
            </button>
            {preview && <img src={preview} alt="Preview" style={{ maxWidth: 200, marginTop: 8 }} />}
            {status === 'error' && <p style={{ color: 'red' }}>File too large (max 5MB)</p>}
            {status === 'done'  && <p style={{ color: 'green' }}>Uploaded!</p>}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

// Q1: What is the difference between a Server Action and a Route Handler?
// → Server Action: function marked 'use server', called directly from
//   components like a normal function or bound to <form action>.
//   No HTTP knowledge needed. Ideal for mutations tied to UI.
//
//   Route Handler: standard HTTP endpoint (GET/POST/etc.) at app/api/**/route.ts.
//   Called via fetch('/api/...'). Ideal for external consumers (mobile apps,
//   webhooks, third-party integrations) or complex REST semantics.

// Q2: What does useFormStatus() return and where must it be called?
// → Returns { pending, data, method, action }.
//   pending: true while the parent form's Server Action is in-flight.
//   MUST be called in a CHILD component of the <form> — not in the
//   same component that renders the form. This is why SubmitButton
//   is always a separate component.

// Q3: What is the risk of skipping signature verification in a webhook handler?
// → Anyone can POST fake events to your endpoint. Without verifying
//   the HMAC signature from the provider (e.g. Stripe), an attacker
//   could trigger actions like marking orders as paid or granting
//   premium access without actually paying.

// Q4: Why does a webhook handler read request.text() instead of request.json()?
// → HMAC signature verification runs against the RAW request body bytes.
//   Parsing to JSON first may change whitespace or key ordering, making
//   the signature check fail on a valid payload. Always verify raw, then parse.

// Q5: Implement an optimistic todo list toggle
interface Todo { id: string; text: string; done: boolean; }

function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
    return (
        <li
            onClick={() => onToggle(todo.id)}
            style={{
                cursor: 'pointer',
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#9ca3af' : 'inherit',
            }}
        >
            {todo.done ? '✅' : '⬜'} {todo.text}
        </li>
    );
}

function OptimisticTodoList({ initial }: { initial: Todo[] }) {
    const [todos, setTodos] = useState<Todo[]>(initial);

    const toggleTodo = (id: string) => {
        // Optimistic update — no await
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
        // In real app: call Server Action here, roll back on error
    };

    return (
        <ul>
            {todos.map(t => <TodoItem key={t.id} todo={t} onToggle={toggleTodo} />)}
        </ul>
    );
}

// Q6: When should you prefer Server Actions over Route Handlers?
// → Server Actions: mutations tied to a specific UI form, operations
//   that only your own frontend calls, simple CRUD with revalidation.
//
//   Route Handlers: external API consumers (mobile, 3rd party), webhooks
//   (POST from Stripe/GitHub), complex HTTP semantics (Content-Type headers,
//   streaming, SSE), or when you need to control the HTTP response precisely.

export { CreatePostForm, LikeButton, ImageUpload, TodoItem, OptimisticTodoList };
