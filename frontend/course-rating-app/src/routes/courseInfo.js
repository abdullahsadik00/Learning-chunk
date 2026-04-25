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
courseRoutes.get('/', verifyToken, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
    fs.readFile(courseDataPath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json({ message: "Internal Server Error" });

        try {
            const courseData = JSON.parse(data);
            res.status(200).json(courseData);
        } catch (parseErr) {
            console.error("JSON parse error:", parseErr);
            res.status(500).json({ message: "Invalid course data" });
        }
    });
});


// GET course by ID
courseRoutes.get('/:courseId', (req, res) => {
    const courseId = Number(req.params.courseId);

    fs.readFile(courseDataPath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json({ message: "Internal Server Error" });

        try {
            const courseData = JSON.parse(data);
            const filteredCourse = courseData.poonaCollege.filter(c => c.courseId === courseId);

            if (filteredCourse.length > 0) {
                res.status(200).json(filteredCourse);
            } else {
                res.status(404).json({ message: "Course not found" });
            }
        } catch (parseErr) {
            console.error("JSON parse error:", parseErr);
            res.status(500).json({ message: "Invalid course data" });
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
        if (err) return res.status(500).json({ message: "Internal Server Error" });

        let courseData;
        try {
            courseData = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ message: "Corrupted JSON file" });
        }

        courseData.poonaCollege.push(newCourse);

        fs.writeFile(courseDataPath, JSON.stringify(courseData, null, 2), 'utf-8', (err) => {
            if (err) return res.status(500).json({ message: "Internal Server Error" });

            res.status(201).json({
                message: "Course added successfully",
                course: newCourse
            });
        });
    });
});

// POST update course rating
courseRoutes.post('/:courseId/averageRating', (req, res) => {
    const courseId = Number(req.params.courseId);
    const rating = Number(req.body.rating);

    if (isNaN(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating value" });
    }

    fs.readFile(courseDataPath, 'utf-8', (err, data) => {
        if (err) return res.status(500).json({ message: "Internal Server Error" });

        let courseData;
        try {
            courseData = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ message: "Corrupted JSON file" });
        }

        const courseIndex = courseData.poonaCollege.findIndex(c => c.courseId === courseId);
        if (courseIndex === -1) return res.status(404).json({ message: "Course not found" });

        const course = courseData.poonaCollege[courseIndex];
        const newAverage = ((course.averageRating * course.numberOfRatings) + rating) / (course.numberOfRatings + 1);

        course.averageRating = parseFloat(newAverage.toFixed(2));
        course.numberOfRatings += 1;

        courseData.poonaCollege[courseIndex] = course;

        fs.writeFile(courseDataPath, JSON.stringify(courseData, null, 2), 'utf-8', (err) => {
            if (err) return res.status(500).json({ message: "Internal Server Error" });

            res.status(200).json({
                message: "Average rating updated successfully",
                course
            });
        });
    });
});

// Export the router using default export
export default courseRoutes;