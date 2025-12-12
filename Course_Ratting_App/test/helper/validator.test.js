import { expect } from 'chai';
import * as Validators from '../../src/helpers/validator.js';
import courseData from '../../src/course.json' assert { type: "json" };

let courseInfo = {
    course: "Mathematics",
    courseId: 2,
    cohort: "2023",
    college: "Science",
    semester: "Fall",
    instructor: "Dr. Smith",
    averageRating: 4.5,
    studentsVoted: 30
};

describe('Testing the validator function', function() {
    it('1. validateCourseInfo should return hasError false for valid course info', function() {
        
        const result = Validators.validateCourseInfo(courseInfo);
        expect(result).to.deep.equal({
            hasError: false,
            message: "course has been added"
        });
    });

    it('2. validateCourseInfo should return hasError true for invalid course info', function() {
        
        let invalidCourseInfo = { ...courseInfo };
        delete invalidCourseInfo.courseId; // Remove a required property

        const result = Validators.validateCourseInfo(invalidCourseInfo);
        expect(result).to.deep.equal({
            hasError: true,
            message: "course cannot be added"
        });
    });

    it('3. validateAverageRating should return true for valid ratings', function() {
        
        expect(Validators.validateAverageRating(3)).to.be.true;
        expect(Validators.validateAverageRating(1)).to.be.true;
        expect(Validators.validateAverageRating(5)).to.be.true;
    });

    it('4. validateAverageRating should return false for invalid ratings', function() {
        
        expect(Validators.validateAverageRating(0)).to.be.false;
        expect(Validators.validateAverageRating(6)).to.be.false;
        expect(Validators.validateAverageRating(-2)).to.be.false;
        expect(Validators.validateAverageRating("4")).to.be.false;
        expect(Validators.validateAverageRating(null)).to.be.false;
    });

    it('5. validateUniqueCourseId should return false for duplicate courseId', function() {

        const result = Validators.validateUniqueCourseId(courseInfo, courseData);
        expect(result).to.be.false;
    });

    it('6. validateUniqueCourseId should return true for unique courseId', function() {
        const uniqueCourseInfo = { ...courseInfo, courseId: 999 };
        const result = Validators.validateUniqueCourseId(uniqueCourseInfo, courseData);
        expect(result).to.be.true;
    });
});