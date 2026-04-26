export function validateCourseInfo(courseInfo) {
    if (
        Object.prototype.hasOwnProperty.call(courseInfo, 'course') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'courseId') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'cohort') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'college') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'semester') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'instructor') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'averageRating') &&
        Object.prototype.hasOwnProperty.call(courseInfo, 'studentsVoted')
    ) {
        return {
            hasError: false,
            message: 'course has been added'
        };
    } else {
        return {
            hasError: true,
            message: 'course cannot be added'
        };
    }
}

export function validateAverageRating(rating) {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
}

export function validateUniqueCourseId(courseInfo, courseData) {
    let valueFound = courseData.poonaCollege.some(el => el.courseId === courseInfo.courseId);
    if (valueFound) {return false;}
    return true;
}