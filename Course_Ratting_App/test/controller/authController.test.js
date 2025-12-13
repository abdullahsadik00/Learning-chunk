// Import necessary dependencies
import * as chai from "chai";
import chaiHttp from "chai-http";
import app from '../../src/index.js'; // Correct import for app

// Set up Chai
chai.use(chaiHttp);

// You can now use chai.request() to send HTTP requests in your tests
const { expect } = chai;

describe('Basic API Test', () => {
    it('should return a 200 status for /', (done) => {
        chai.request(app)
            .get('/')
            .end((err, res) => {
                expect(res.status).to.equal(200);
                done();
            });
    });
});


describe('Verify signup flow', () => {
    it("successful signup", (done) => {
        let signupBody = {
            fullName: 'test name',
            email: 'test12345@gmail.com',
            role: 'admin',
            password: 'test1234'
        };

        chai.request(app)  // Use app here
            .post('/register')
            .send(signupBody)
            .end((err, res) => {
                expect(res.status).to.equal(200);
                expect(res.body.message).to.equal('User Registered successfully');
                done();
            });
    });
});
