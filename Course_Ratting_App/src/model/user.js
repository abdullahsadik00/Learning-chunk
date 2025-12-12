import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Username should be unique"],
        unique: true
    },
    email: {
        type: String,
        required: [true, "Email should be unique"],
        unique: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: '{VALUE} is not a valid email!'
        }
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
        required: [true, "Please specify user role"]
    }
});

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);