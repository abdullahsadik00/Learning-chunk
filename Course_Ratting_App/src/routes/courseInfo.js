import { Router } from 'express';  // ES module import for Router
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';  // For path handling
import { validateCourseInfo } from '../helpers/validator.js';  // ES module import
import verifyToken from '../middleware/verifyToken.js';  // ES module import

// Get the equivalent of __dirname in ES Modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Load course data from JSON file
const courseDataPath = path.join(__dirname, '..', 'course.json');

// Middleware
const courseRoutes = Router();
courseRoutes.use(bodyParser.json());
courseRoutes.use(bodyParser.urlencoded({ extended: true }));

// GET all courses
courseRoutes.get('/', (req, res) => {
    fs.readFile(courseDataPath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
        let courseData;
        try {
            courseData = JSON.parse(data);
        } catch (parseErr) {
            console.error("Error parsing JSON data:", parseErr);
            return res.status(500).json({ message: "Invalid course data" });
        }

        res.status(200).json(courseData);
    });
});

// GET course by ID
courseRoutes.get('/:courseId', (req, res) => {
    const courseId = Number(req.params.courseId);

    fs.readFile(courseDataPath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
        let courseData;
        try {
            courseData = JSON.parse(data);
        } catch (parseErr) {
            console.error("Error parsing JSON data:", parseErr);
            return res.status(500).json({ message: "Invalid course data" });
        }

        const filteredCourse = courseData.poonaCollege.filter(course => course.courseId === courseId);
        if (filteredCourse.length > 0) {
            return res.status(200).json(filteredCourse);
        } else {
            return res.status(404).json({ message: "Course not found" });
        }
    });
});

// POST create a new course
courseRoutes.post('/', verifyToken, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ hasError: true, message: "Unauthorized: Please log in to add a course." });
    }
    const newCourse = req.body;
    const validationResult = validateCourseInfo(newCourse);

    if (validationResult.hasError) {
        return res.status(400).json({
            message: "Invalid course data",
            details: validationResult.message
        });
    }

    fs.readFile(courseDataPath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            console.error("JSON parse error:", e);
            return res.status(500).json({ message: "Corrupted JSON file" });
        }

        jsonData.poonaCollege.push(newCourse);

        fs.writeFile(courseDataPath, JSON.stringify(jsonData, null, 2), 'utf-8', (err) => {
            if (err) {
                console.error("Error writing file:", err);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            res.status(201).json({
                message: "Course added successfully",
                course: newCourse
            });
        });
    });
});

// POST update course rating
courseRoutes.post('/:courseId/averageRating', (req, res) => {
    let courseId = Number(req.params.courseId);
    let ratingPassed = Number(req.body.rating);

    if (validateCourseInfo(ratingPassed)) { // Assuming validateAverageRating was used here
        fs.readFile(courseDataPath, 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return res.status(500).json({ message: "Internal Server Error" });
            }

            let courseDataModified = JSON.parse(data);
            let filterCourseData = courseDataModified.poonaCollege.filter(course => course.courseId === courseId);

            if (filterCourseData.length === 0) {
                return res.status(404).json({ message: "Course not found" });
            }

            let currentAverage = filterCourseData[0].averageRating || 0;
            let numberOfRatings = filterCourseData[0].numberOfRatings || 0;

            let newAverage = ((currentAverage * numberOfRatings) + ratingPassed) / (numberOfRatings + 1);
            filterCourseData[0].averageRating = parseFloat(newAverage.toFixed(2));
            filterCourseData[0].numberOfRatings = numberOfRatings + 1;

            // Update the main course data
            for (let i = 0; i < courseDataModified.poonaCollege.length; i++) {
                if (courseDataModified.poonaCollege[i].courseId === courseId) {
                    courseDataModified.poonaCollege[i] = filterCourseData[0];
                    break;
                }
            }

            fs.writeFile(courseDataPath, JSON.stringify(courseDataModified, null, 2), 'utf-8', (err) => {
                if (err) {
                    console.error("Error writing file:", err);
                    return res.status(500).json({ message: "Internal Server Error" });
                }

                res.status(200).json({
                    message: "Average rating updated successfully",
                    course: filterCourseData[0]
                });
            });
        });
    } else {
        res.status(400).json({ message: "Invalid rating value" });
    }
});

// Export the router using default export
export default courseRoutes;