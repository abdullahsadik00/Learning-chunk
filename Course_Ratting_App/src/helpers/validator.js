class Validators {
    static validateCourseInfo(courseInfo) {
        if (courseInfo.hasOwnProperty("course")
            && courseInfo.hasOwnProperty("courseId") &&
            courseInfo.hasOwnProperty("cohort") &&
            courseInfo.hasOwnProperty("college") &&
            courseInfo.hasOwnProperty("semester") &&
            courseInfo.hasOwnProperty("instructor") &&
            courseInfo.hasOwnProperty("averageRating") &&
            courseInfo.hasOwnProperty("studentsVoted")) {
            return {
                "hasError": false,
                "message": "course has been added"
            }
        } else {
            return {
                "hasError": true,
                "message": "course cannot be added"
            }
        }
    }

    static validateAverageRating(rating) {
        if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
            return true;
        } else {
            return false;
        }
    }
}

module.exports = Validators;
