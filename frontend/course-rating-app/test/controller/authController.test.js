import request from "supertest";
import app from "../../src/index.js";
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

    it("signup fails with incorrect email", async () => {
        const res = await request(app)
            .post("/register")
            .send({
                fullName: "test name",
                email: "test@testmail.com@gmail.com",
                role: "admin",
                password: "test1234"
            });

        expect(res.status).to.equal(500);
        expect(res.body.message).to.equal("Error registering user");
    });

    it("signup fails with incorrect role", async () => {
        const res = await request(app)
            .post("/register")
            .send({
                fullName: "test name",
                email: "test@testmail.com",
                role: "test",
                password: "test1234"
            });

        expect(res.status).to.equal(500);
        expect(res.body.message).to.equal("Error registering user");
    });

    it("signup fails with missing fields", async () => {
        const res = await request(app)
            .post("/register")
            .send({
                email: "test1@testmail.com",
                role: "test"
            });

        expect(res.status).to.equal(500);
        expect(res.body.message).to.equal("Error registering user");
    });
});

describe("Verify login flow", () => {

    beforeEach((done) => {
        request(app)
            .post("/register")
            .send({
                fullName: "login user",
                email: "login@testmail.com",
                role: "admin",
                password: "test1234"
            }).end(() => {
                console.log("User registered for login tests");
                done();
            });
    });

    it("successful login", (done) => {
        request(app)
            .post("/login")
            .send({
                email: "login@testmail.com",
                password: "test1234"
            }).end((err, res) => {
                console.log("successful login res.body", res.body);
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property("token");
                done();
            });
    });

    it("login fails with incorrect password", (done) => {
        request(app)
            .post("/login")
            .send({
                email: "login@testmail.com",
                password: "invalidpassword"
            }).end((err, res) => {

                expect(res.status).to.equal(401);
                expect(res.body.message).to.equal("Invalid password");
                done();
            });
    });

    it("login fails with unregistered email", (done) => {
        request(app)
            .post("/login")
            .send({
                'email': 'someOtherTest@gmail.com',
                'password': 'test12345'
            }).end((err, res) => {
                expect(res.status).to.equal(404);
                expect(res.body.message).to.equal("User not found");
                done();
            }
            );
    });

});