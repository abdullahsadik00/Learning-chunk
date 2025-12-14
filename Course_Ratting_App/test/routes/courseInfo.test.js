import request from "supertest";
import app from "../../src/index.js";
import { expect } from "chai";

import fs from "fs";
import path from "path";

const courseDataPath = path.join(process.cwd(), "src", "course.json");

describe("Course API Endpoints", () => {
    let token;

    // Register and login user before tests
    before(async () => {
        await request(app)
            .post("/register")
            .send({
                fullName: "login user",
                email: "login@testmail.com",
                role: "admin",
                password: "test1234"
            });

        const res = await request(app)
            .post("/login")
            .send({ email: "login@testmail.com", password: "test1234" });

        console.log("Login response:", res.body); // <-- Debug log
        token = res.body.token.split(' ')[1]; // Extract JWT token without duplicate "Bearer"
        console.log("Extracted token:", token); // <-- Debug log
    });

    // Reset JSON before each test
    beforeEach(() => {
        const initialData = {
            poonaCollege: [
                { courseId: 1, name: "Math", averageRating: 4, numberOfRatings: 1 },
                { courseId: 2, name: "Physics", averageRating: 3, numberOfRatings: 2 }
            ]
        };
        fs.writeFileSync(courseDataPath, JSON.stringify(initialData, null, 2), "utf-8");
    });

    /** GET /courses */
    it("GET /courses - success with valid token", async () => {
        const res = await request(app)
            .get("/courses")
            .set("Authorization", `Bearer ${token}`);
        console.log("GET /courses response:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property("poonaCollege");
        expect(res.body.poonaCollege).to.have.lengthOf(2);
    });

    it("GET /courses - fails with invalid token", async () => {
        const res = await request(app)
            .get("/courses")
            .set("Authorization", "Bearer InvalidToken");
        console.log("GET /courses with invalid token:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal("Invalid JWT token");
    });

    it("GET /courses - fails without token", async () => {
        const res = await request(app).get("/courses");
        console.log("GET /courses without token:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal("Authorization header not found");
    });

    /** POST /courses */
    it("POST /courses - success with valid course", async () => {
        const newCourse = { courseId: 3, name: "Chemistry", averageRating: 0, numberOfRatings: 0 };
        const res = await request(app)
            .post("/courses")
            .set("Authorization", `Bearer ${token}`)
            .send(newCourse);
        console.log("POST /courses response:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(201);
        expect(res.body.course).to.deep.equal(newCourse);
    });

    it("POST /courses - fails with invalid course data", async () => {
        const invalidCourse = { courseId: 4 }; // missing name, averageRating, etc.
        const res = await request(app)
            .post("/courses")
            .set("Authorization", `Bearer ${token}`)
            .send(invalidCourse);
        console.log("POST /courses invalid data response:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal("Invalid course data");
    });

    it("POST /courses - fails without token", async () => {
        const course = { courseId: 5, name: "Biology", averageRating: 0, numberOfRatings: 0 };
        const res = await request(app).post("/courses").send(course);
        console.log("POST /courses without token response:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(401);
        expect(res.body.message).to.equal("Unauthorized: Please log in to add a course.");
    });

    /** POST /courses/:courseId/averageRating */
    it("POST /courses/:courseId/averageRating - success", async () => {
        const res = await request(app)
            .post("/courses/1/averageRating")
            .send({ rating: 5 });
        console.log("POST /courses/1/averageRating success:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(200);
        expect(res.body.course.averageRating).to.equal(4.5);
    });

    it("POST /courses/:courseId/averageRating - fails for invalid rating", async () => {
        const res = await request(app)
            .post("/courses/1/averageRating")
            .send({ rating: "invalid" });
        console.log("POST /courses/1/averageRating invalid rating:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal("Invalid rating value");
    });

    it("POST /courses/:courseId/averageRating - fails for non-existing course", async () => {
        const res = await request(app)
            .post("/courses/999/averageRating")
            .send({ rating: 5 });
        console.log("POST /courses/999/averageRating response:", res.status, res.body); // <-- Debug log
        expect(res.status).to.equal(404);
        expect(res.body.message).to.equal("Course not found");
    });
});