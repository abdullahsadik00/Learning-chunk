// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';

// Import routes
import * as authRoutes from './controller/authController.js';  // Correct
// import authRoutes from './controller/authController.js'; // Use `.js` extension for ES Modules
import courseRoutes from './routes/courseInfo.js';      // Use `.js` extension for ES Modules

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
process.on('unhandledRejection', error => {
    console.log('unhandledRejection', error.message);
  });
  
  if(process.env.NODE_ENV != 'test') {
  //Connect to database
    try {
      mongoose.connect("mongodb://localhost:27017/usersdb", {
        useUnifiedTopology: true,
        useNewUrlParser: true
      });
      console.log("connected to db");
    } catch (error) {
      handleError(error);
    }
  }
// ROUTES
app.post('/register', authRoutes.register);
app.post('/login', authRoutes.login);

app.use('/courses', courseRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export app as default (This is necessary for test files to import app)
export default app;