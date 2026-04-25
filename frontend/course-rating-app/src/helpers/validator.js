export function validateCourseInfo(courseInfo) {
    if (
        courseInfo.hasOwnProperty("course") &&
        courseInfo.hasOwnProperty("courseId") &&
        courseInfo.hasOwnProperty("cohort") &&
        courseInfo.hasOwnProperty("college") &&
        courseInfo.hasOwnProperty("semester") &&
        courseInfo.hasOwnProperty("instructor") &&
        courseInfo.hasOwnProperty("averageRating") &&
        courseInfo.hasOwnProperty("studentsVoted")
    ) {
        return {
            hasError: false,
            message: "course has been added"
        };
    } else {
        return {
            hasError: true,
            message: "course cannot be added"
        };
    }
}

export function validateAverageRating(rating) {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
}

export function validateUniqueCourseId(courseInfo, courseData) {
    let valueFound = courseData.poonaCollege.some(el => el.courseId === courseInfo.courseId);
    if (valueFound) return false;
    return true;
}