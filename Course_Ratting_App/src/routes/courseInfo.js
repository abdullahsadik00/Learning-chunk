const courseRoutes = require('express').Router();
const courseData = require('../../course.json');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const validators = require('../helpers/validator');

// Middleware
courseRoutes.use(bodyParser.json());
courseRoutes.use(bodyParser.urlencoded({ extended: true }));

// GET all courses
courseRoutes.get('/', (req, res) => {
    res.status(200).json(courseData);
});

courseRoutes.get('/:courseId', (req, res) => {
    const courseId = Number(req.params.courseId);

    console.log("Course ID:", courseId);
    console.log("Course Data:", courseData.poonaCollege);
    let fillterCourseData = courseData.poonaCollege.filter(course => course.courseId === courseId);
    res.status(200).json(fillterCourseData);
});

courseRoutes.post('/', (req, res) => {
    const newCourse = req.body;
    const validationResult = validators.validateCourseInfo(newCourse);

    if (validationResult.hasError) {
        return res.status(400).json({
            message: "Invalid course data",
            details: validationResult.message
        });
    }
    const writePath = path.join(__dirname, '..', 'course.json');

    fs.readFile(writePath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        // If file is empty -> initialize structure
        if (!data || data.trim() === "") {
            data = '{"poonaCollege": []}';
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            console.error("JSON parse error:", e);
            return res.status(500).json({ message: "Corrupted JSON file" });
        }

        jsonData.poonaCollege.push(newCourse);

        fs.writeFile(writePath, JSON.stringify(jsonData, null, 2), 'utf-8', (err) => {
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

module.exports = courseRoutes;