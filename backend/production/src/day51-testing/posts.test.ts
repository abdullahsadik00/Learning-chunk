// ════════════════════════════════════════════════════════════════
// DAY 51 — API TESTING WITH JEST + SUPERTEST
// ════════════════════════════════════════════════════════════════
//
// SUPERTEST:
//   Supertest wraps your Express app and makes HTTP requests against it
//   without starting a real server — no port, no network stack.
//
//   Under the hood: supertest calls app.listen(0) (random port) for each
//   test file, makes the request, then closes the server. This means:
//   - Tests run in isolation (no port conflicts between test files)
//   - Tests are fast (no network round-trip)
//   - Tests work in CI with no infrastructure
//
//   Basic usage:
//     const response = await request(app).get('/api/posts');
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual([]);
//
//   With body:
//     const response = await request(app)
//       .post('/api/posts')
//       .send({ title: 'Hello', content: 'World' });
//
// WHY TEST THE HTTP LAYER?
//   Unit tests:        test pure functions (formatters, validators) in isolation
//   Integration tests: test modules together (service + real DB)
//   API tests:         test the FULL HTTP path — routing, middleware, validation,
//                      response shape, status codes — all in one assertion
//
//   API tests give you high confidence that what clients see actually works.
//   They also serve as living documentation of your API contract.
//
// TEST ISOLATION:
//   Each test must start from a known, clean state. Otherwise:
//   - Test A creates a post
//   - Test B runs GET /api/posts expecting an empty list — it fails!
//
//   Our app uses an in-memory store → call resetStore() in beforeEach.
//
//   For DB-backed apps, common strategies:
//   1. Transactions: wrap each test in a transaction, rollback after
//      (works with Prisma's $transaction or knex transactions)
//   2. Test database: separate DB, truncate all tables before each test
//   3. Test containers: spin up a real DB in Docker for the test run
//
// WHAT TO TEST:
//   ✅ Happy path (valid request → expected response)
//   ✅ Validation errors (missing fields, wrong types → 400)
//   ✅ Not found (GET /posts/999 → 404)
//   ✅ Correct status codes (201 for create, 204 for delete, 404 for missing)
//   ✅ Response shape (the fields clients depend on)
//   ✅ Side effects (did the store actually change?)
//   ❌ Internal implementation (which variable stores the data)
//   ❌ Every possible invalid input (pick representative cases)
//
// JEST ANATOMY:
//   describe()   → group related tests (appears in output)
//   it() / test() → single test case
//   beforeEach() → runs before EACH test in the current describe block
//   afterAll()   → runs once after ALL tests in the current describe block
//   expect()     → assertion — throws if the condition isn't met
//   .toBe()      → strict equality (===)
//   .toEqual()   → deep equality (objects, arrays)
//   .toHaveProperty() → checks object has key (optionally with value)
//   .toMatch()   → string/regex match

import request from 'supertest';
import { app, resetStore } from './app';

// ──────────────────────────────────────────────────────────────
// TEST SETUP
// ──────────────────────────────────────────────────────────────

// beforeEach runs before EVERY test in this entire file.
// Wiping the store here ensures tests can't accidentally share state.
// If you forget this, you'll get "flaky tests" — tests that pass in
// isolation but fail when run together (order-dependent failures).
beforeEach(() => {
  resetStore();
});

// ══════════════════════════════════════════════════════════════
// GET /api/posts
// ══════════════════════════════════════════════════════════════

describe('GET /api/posts', () => {
  it('returns an empty array when no posts exist', async () => {
    // WHY test this? The default state must be an empty array, not null/undefined.
    // Clients iterate over the response — if it's not an array, they'll crash.
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    // .toEqual([]) does deep equality — [] === [] is false in JS,
    // so we can't use .toBe([]) here.
    expect(res.body).toEqual([]);
  });

  it('returns all posts', async () => {
    // Seed the store via POST requests (testing through the API, not internals)
    await request(app)
      .post('/api/posts')
      .send({ title: 'Post 1', content: 'Content 1', published: true });
    await request(app)
      .post('/api/posts')
      .send({ title: 'Post 2', content: 'Content 2', published: false });

    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    // WHY .toHaveLength? We care that both posts are returned, not their exact shape.
    // If we used .toEqual([post1, post2]), we'd be asserting on createdAt timestamps
    // which change on every run — brittle test.
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('title', 'Post 1');
    expect(res.body[1]).toHaveProperty('title', 'Post 2');
  });

  it('returns only published posts when ?published=true', async () => {
    // Seed: one published, one draft
    await request(app)
      .post('/api/posts')
      .send({ title: 'Published', content: 'Content', published: true });
    await request(app)
      .post('/api/posts')
      .send({ title: 'Draft', content: 'Content', published: false });

    const res = await request(app).get('/api/posts?published=true');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    // WHY assert published: true? We want to confirm the filter worked,
    // not just that the count is right.
    expect(res.body[0]).toHaveProperty('published', true);
    expect(res.body[0]).toHaveProperty('title', 'Published');
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/posts/:id
// ══════════════════════════════════════════════════════════════

describe('GET /api/posts/:id', () => {
  it('returns a post by id', async () => {
    // Create a post and capture its id from the response
    const createRes = await request(app)
      .post('/api/posts')
      .send({ title: 'Test post', content: 'Body', published: true });

    const postId = createRes.body.id as number;

    const res = await request(app).get(`/api/posts/${postId}`);

    expect(res.status).toBe(200);
    // Assert the full shape we promise to clients
    expect(res.body).toHaveProperty('id', postId);
    expect(res.body).toHaveProperty('title', 'Test post');
    expect(res.body).toHaveProperty('content', 'Body');
    expect(res.body).toHaveProperty('published', true);
    // createdAt should be a valid ISO date string
    expect(res.body).toHaveProperty('createdAt');
    expect(() => new Date(res.body.createdAt as string)).not.toThrow();
  });

  it('returns 404 for a nonexistent id', async () => {
    // WHY test this? 404 is part of our API contract — clients need to
    // handle "not found" and must get a clear signal to do so.
    const res = await request(app).get('/api/posts/999');

    expect(res.status).toBe(404);
    // Also assert the error shape — clients parse this to show user messages
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════
// POST /api/posts
// ══════════════════════════════════════════════════════════════

describe('POST /api/posts', () => {
  it('creates a post with a valid body and returns 201', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'New post', content: 'Some content', published: true });

    // WHY 201 and not 200? 201 Created is the correct HTTP status for resource creation.
    // Clients (especially caches) treat 201 differently from 200.
    expect(res.status).toBe(201);

    // Assert every field clients depend on
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', 'New post');
    expect(res.body).toHaveProperty('content', 'Some content');
    expect(res.body).toHaveProperty('published', true);
    expect(res.body).toHaveProperty('createdAt');
  });

  it('sets a Location header pointing to the new resource', async () => {
    // Location header is a standard HTTP mechanism.
    // Clients can follow it to read the created resource without knowing its id upfront.
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Post', content: 'Content' });

    // .toMatch() accepts a regex or string — the id is dynamic so we use regex
    expect(res.headers['location']).toMatch(/^\/api\/posts\/\d+$/);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/posts')
      // No title field
      .send({ content: 'Some content' });

    expect(res.status).toBe(400);
    // The error body should tell clients WHICH field failed validation
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  it('returns 400 when content is missing', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'A title' }); // No content

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('sets published to false by default when not provided', async () => {
    // Our schema has published as optional with a default of false.
    // This test locks in that behavior — if someone changes the default,
    // the test catches it.
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Draft', content: 'Content' }); // No published field

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('published', false);
  });

  it('auto-increments ids across multiple posts', async () => {
    // IDs must be unique and increasing — otherwise clients can't reference posts.
    // After resetStore(), nextId resets to 1 — predictable in tests.
    const res1 = await request(app)
      .post('/api/posts')
      .send({ title: 'First', content: 'Content' });
    const res2 = await request(app)
      .post('/api/posts')
      .send({ title: 'Second', content: 'Content' });

    expect(res1.body.id).toBe(1);
    expect(res2.body.id).toBe(2);
    // Each post has a unique id
    expect(res1.body.id).not.toBe(res2.body.id);
  });
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/posts/:id
// ══════════════════════════════════════════════════════════════

describe('PATCH /api/posts/:id', () => {
  it('updates only the fields provided in the request body', async () => {
    // Create a post first
    const createRes = await request(app)
      .post('/api/posts')
      .send({ title: 'Original title', content: 'Original content', published: false });

    const postId = createRes.body.id as number;

    // Only update the title — content and published should remain unchanged
    const patchRes = await request(app)
      .patch(`/api/posts/${postId}`)
      .send({ title: 'Updated title' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toHaveProperty('title', 'Updated title');
    // WHY assert the unchanged fields? Confirm we're doing a partial update,
    // not accidentally wiping the whole record.
    expect(patchRes.body).toHaveProperty('content', 'Original content');
    expect(patchRes.body).toHaveProperty('published', false);
  });

  it('publishes a draft post', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .send({ title: 'Draft', content: 'Draft content', published: false });

    const postId = createRes.body.id as number;

    const patchRes = await request(app)
      .patch(`/api/posts/${postId}`)
      .send({ published: true });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toHaveProperty('published', true);
  });

  it('returns 404 for a nonexistent post', async () => {
    const res = await request(app)
      .patch('/api/posts/999')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/posts/:id
// ══════════════════════════════════════════════════════════════

describe('DELETE /api/posts/:id', () => {
  it('deletes a post and returns 204 No Content', async () => {
    // Create the post to delete
    const createRes = await request(app)
      .post('/api/posts')
      .send({ title: 'To delete', content: 'Content' });

    const postId = createRes.body.id as number;

    // Delete it
    const deleteRes = await request(app).delete(`/api/posts/${postId}`);

    // WHY 204 and not 200? 204 explicitly signals "success but no response body".
    // Some clients check for a body on 200 — 204 removes ambiguity.
    expect(deleteRes.status).toBe(204);
    // 204 responses MUST NOT have a body (HTTP spec)
    expect(deleteRes.body).toEqual({});

    // Verify the post is actually gone — one extra GET to confirm the side effect
    const getRes = await request(app).get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when trying to delete a nonexistent post', async () => {
    const res = await request(app).delete('/api/posts/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
