import { expect, use } from "chai";
import bcrypt from "bcrypt";
import sinon from "sinon";
import { User } from "../../src/model/user.js";

describe("Creating Document in User Model", function () {
    it('1. Creates a New User Successfully', (done) => {
        const userData = new User({
            fullName: "John Doe",
            email: "John.Doe@testmail.com",
            password: bcrypt.hashSync("SecurePass123", 10),
            role: "student"
        });
        userData.save().then((user) => {
            // console.log("User Created: ", user);
            expect(!user.isNew).equal(true);
            done();
        })
    });


    it('2. Fails to Create User with Duplicate Email', (done) => {
        const userData1 = new User({
            fullName: "Jane Smith",
            email: "John.Smith@testmail.com",
            password: bcrypt.hashSync("AnotherPass123", 10),
            role: "student"
        });

        userData1.save()
            .then(() => {
                const userData2 = new User({
                    fullName: "Jake Johnson",
                    email: "John.Smith@testmail.com",
                    password: bcrypt.hashSync("DiffPass123", 10),
                    role: "admin"
                });
                return userData2.save();
            })
            .then(() => {
                done(new Error("Expected duplicate email error, but none occurred."));
            })
            .catch((err) => {
                console.log("Error on duplicate email as expected: ", err.message);
                expect(err).to.exist;
                expect(err.code).to.equal(11000); // MongoDB duplicate key error code
                done();
            });
    });

    it('3. Fails to Create User with Invalid Email Format', (done) => {
        const userData = new User({
            fullName: "Invalid Email User",
            email: "invalid-email-format",
            password: bcrypt.hashSync("Pass123", 10),
            role: "student"
        });

        userData.save()
            .then(() => {
                done(new Error("Expected validation error for invalid email, but none occurred."));
            })
            .catch((err) => {
                expect(err).to.exist;
                expect(err.errors.email).to.exist;
                expect(err.errors.email.message).to.equal('invalid-email-format is not a valid email!');
                done();
            });
    });

    it('4. Fails to Create User without Required Fields', (done) => {
        const userData = new User({
            email: "",
            password: "",
            role: "student"
        });

        userData.save()
            .then(() => {
                done(new Error("Expected validation error for missing required fields, but none occurred."));
            })
            .catch((err) => {
                expect(err).to.exist;
                expect(err.errors.fullName).to.exist;
                expect(err.errors.fullName.message).to.equal('Username should be unique');
                expect(err.errors.email).to.exist;
                expect(err.errors.email.message).to.equal('Email should be unique');
                expect(err.errors.password).to.exist;
                expect(err.errors.password.message).to.equal('Path `password` is required.');
                done();
            });
    });

    it('5. Fails to Create User with Invalid Role', (done) => {
        const userData = new User({
            fullName: "Invalid Role User",
            email: "John.Smith@testmail.com",
            password: bcrypt.hashSync("Pass123", 10),
            role: "guest"
        });

        userData.save()
            .then(() => {
                done(new Error("Expected validation error for invalid role, but none occurred."));
            })
            .catch((err) => {
                expect(err).to.exist;
                expect(err.errors.role).to.exist;
                expect(err.errors.role.message).to.equal('`guest` is not a valid enum value for path `role`.');
                done();
            });
    });
});