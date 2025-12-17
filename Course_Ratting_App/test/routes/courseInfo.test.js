import request from "supertest";
import app from "../../src/index.js";
import { expect } from "chai";

describe("Course API Endpoints", () => {
    let token;

    // Create user + login before EACH test
    beforeEach(async () => {
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
            .send({
                email: "login@testmail.com",
                password: "test1234"
            });

        token = res.body.token.split(" ")[1];
    });

    /** GET /courses */
    it("GET /courses - success with valid token", async () => {
        const res = await request(app)
            .get("/courses")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property("poonaCollege");
        expect(res.body.poonaCollege).to.be.an("array");
    });

    it("GET /courses - fails with invalid token", async () => {
        const res = await request(app)
            .get("/courses")
            .set("Authorization", "Bearer InvalidToken");

        expect(res.status).to.equal(401);
    });

    it("GET /courses - fails without token", async () => {
        const res = await request(app).get("/courses");

        expect(res.status).to.equal(401);
    });

    /** POST /courses */
    it("POST /courses - success with valid course", async () => {
        const newCourse = {
            course: "Backend Engineering",
            courseId: 40,
            cohort: 1,
            college: "Poona College",
            semester: 3,
            instructor: "Sadik Shaikh",
            averageRating: 0,
            studentsVoted: 0
        };

        const res = await request(app)
            .post("/courses")
            .set("Authorization", `Bearer ${token}`)
            .send(newCourse);

        expect(res.status).to.equal(201);
        expect(res.body.course).to.deep.equal(newCourse);
    });

    it("POST /courses - fails with invalid course data", async () => {
        const invalidCourse = { courseId: 4 };

        const res = await request(app)
            .post("/courses")
            .set("Authorization", `Bearer ${token}`)
            .send(invalidCourse);

        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal("Invalid course data");
    });

    it("POST /courses - fails without token", async () => {
        const course = {
            course: "Biology",
            courseId: 5,
            cohort: 1,
            college: "Poona College",
            semester: 3,
            instructor: "Someone",
            averageRating: 0,
            studentsVoted: 0
        };

        const res = await request(app)
            .post("/courses")
            .send(course);

        expect(res.status).to.equal(401);
        expect(res.body.message).to.equal(
            "Unauthorized: Please log in to add a course."
        );
    });

    /** POST /courses/:courseId/averageRating */
    it("POST /courses/:courseId/averageRating - success", async () => {
        const res = await request(app)
            .post("/courses/1/averageRating")
            .send({ rating: 5 });

        expect(res.status).to.equal(200);
        expect(res.body.course).to.have.property("averageRating");
    });

    it("POST /courses/:courseId/averageRating - fails for invalid rating", async () => {
        const res = await request(app)
            .post("/courses/1/averageRating")
            .send({ rating: "invalid" });

        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal("Invalid rating value");
    });

    it("POST /courses/:courseId/averageRating - fails for non-existing course", async () => {
        const res = await request(app)
            .post("/courses/999/averageRating")
            .send({ rating: 5 });

        expect(res.status).to.equal(404);
        expect(res.body.message).to.equal("Course not found");
    });
});