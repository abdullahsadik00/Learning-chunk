import request from "supertest";
import app from "../../src/index.js"; // keep your file, as requested
import { expect } from "chai";

describe("Verify signup flow", () => {
    it("successful signup", async () => {
        const res = await request(app)
            .post("/register")
            .send({
                fullName: "test name",
                email: "test12345@gmail.com",
                role: "admin",
                password: "test1234"
            });

        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal("User registered successfully");
    });
});
