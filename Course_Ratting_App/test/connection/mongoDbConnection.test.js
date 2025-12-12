
import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

before((done) => {
    mongoose.connect('mongodb://localhost:27017/course_rating_app_test')
        .then(() => {
            console.log("Connected to Test MongoDB");
            done();
        })
        .catch((err) => {
            console.error("Could not connect to Test MongoDB", err);
            done(err);  // Call done with error in case of failure
        });
}).timeout(5000);  // Increase timeout to 5000ms (5 seconds)

beforeEach((done) => {
    mongoose.connection.db.dropDatabase()
        .then(() => {
            console.log("Test database cleared");
            done()
        })
        .catch((err) => done(err));  // Call done with error in case of failure
});

after((done) => {
    mongoose.connection.close()
        .then(() => {
            console.log("Test MongoDB connection closed");
            done()
        })
        .catch((err) => done(err));  // Call done with error in case of failure
});