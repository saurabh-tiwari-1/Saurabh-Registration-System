
const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// POST: Register a new user
router.post(
    "/register",
    [
        body("fullName")
            .trim()
            .notEmpty()
            .withMessage("Full name is required"),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required"),

        body("email")
            .trim()
            .isEmail()
            .withMessage("Enter a valid email"),

        body("phone")
            .trim()
            .notEmpty()
            .withMessage("Phone number is required"),

        body("password")
            .isLength({ min: 8 })
            .withMessage("Password must contain at least 8 characters"),

        body("confirmPassword")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords do not match");
                }
                return true;
            }),

        body("gender")
            .isIn(["Male", "Female", "Other", "male", "female", "other"])
            .withMessage("Select a valid gender")
    ],
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                fullName,
                username,
                email,
                phone,
                password,
                gender
            } = req.body;

            // Check existing user
            const existingUser = await User.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email or username already exists"
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create new user
            const newUser = await User.create({
                fullName,
                username,
                email,
                phone,
                password: hashedPassword,
                gender:
                    gender.charAt(0).toUpperCase() +
                    gender.slice(1).toLowerCase()
            });

            return res.status(201).json({
                success: true,
                message: "Registration successful!",
                user: {
                    id: newUser._id,
                    fullName: newUser.fullName,
                    username: newUser.username,
                    email: newUser.email,
                    phone: newUser.phone,
                    gender: newUser.gender
                }
            });

        } catch (error) {
            console.error("Registration Error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Server error during registration"
            });
        }
    }
);

module.exports = router;
