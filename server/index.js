
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import cmsRoutes from "./routes/cms.js";
import publicRoutes from "./routes/public.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "enquiries.json");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Allowed frontend origins
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Middleware
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  })
);

app.use(express.json({ limit: "20kb" }));

// Validation helpers
const clean = (value, max = 1000) =>
  String(value ?? "").trim().slice(0, max);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[0-9][0-9\s().-]{7,19}$/;

// Email configuration with SMTP connection pooling
const requiredMailSettings = [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_TO",
];

const missingMailSettings = requiredMailSettings.filter(
  (key) => !process.env[key]
);

let transporter = null;

if (missingMailSettings.length === 0) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
} else {
  console.warn(
    "Email is not configured. Missing:",
    missingMailSettings.join(", ")
  );
}

// Save enquiries locally
async function saveEnquiry(enquiry) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  let enquiries = [];

  try {
    const fileContent = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(fileContent);
    enquiries = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...enquiry,
  };

  enquiries.push(record);

  await fs.writeFile(
    DATA_FILE,
    `${JSON.stringify(enquiries, null, 2)}\n`,
    "utf8"
  );

  return record;
}

// Save enquiries to Google Sheets
async function saveEnquiryToGoogleSheet(enquiry) {
  const sheetUrl = process.env.GOOGLE_SHEET_URL?.trim();
  const secret = process.env.GOOGLE_SHEET_SECRET?.trim();

  if (!sheetUrl || !secret) {
    throw new Error("Google Sheets configuration is missing.");
  }

  const payload = {
    secret,
    id: enquiry.id,
    createdAt: enquiry.createdAt,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    city: enquiry.city,
    gender: enquiry.gender,
    course: enquiry.course,
    message: enquiry.message,
  };

  const response = await fetch(sheetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await response.text();
  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Invalid Google Sheets response: ${responseText.slice(0, 300)}`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Google Sheets request failed: ${response.status}`
    );
  }

  return result;
}

// Home API
app.get("/", (_req, res) => {
  res.send("Whitehouse API server is running.");
});

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "Whitehouse API",
  });
});

// CMS APIs (JWT-protected admin routes and published public content)
app.use("/api/admin", cmsRoutes);
app.use("/api/public", publicRoutes);

// Backward-compatible public blog endpoints for the existing website.
app.get("/api/blogs", async (_req, res, next) => {
  try {
    const { Blog } = await import("./models/index.js");
    const blogs = await Blog.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).lean();
    res.json(blogs.map((blog) => ({ ...blog, excerpt: blog.excerpt || blog.description || "", image: blog.image || blog.featuredImage || "", imageAlt: blog.imageAlt || blog.title || "Whitehouse blog image", author: blog.author || "Whitehouse Team", readTime: blog.readTime || "1 min read" })));
  } catch (error) { next(error); }
});
app.get("/api/blogs/:slug", async (req, res, next) => {
  try {
    const { Blog } = await import("./models/index.js");
    const blog = await Blog.findOne({ slug: req.params.slug, status: "published" }).lean();
    if (!blog) return res.status(404).json({ success: false, message: "Blog post not found." });
    res.json({ ...blog, excerpt: blog.excerpt || blog.description || "", image: blog.image || blog.featuredImage || "", imageAlt: blog.imageAlt || blog.title || "Whitehouse blog image", author: blog.author || "Whitehouse Team", readTime: blog.readTime || "1 min read" });
  } catch (error) { next(error); }
});

// Enquiry API - email and Google Sheets run in parallel
app.post("/api/enquiries", async (req, res) => {
  try {
    const body = req.body || {};

    // Honeypot spam protection
    if (clean(body.website, 200)) {
      return res.status(200).json({
        success: true,
        message: "Enquiry received.",
      });
    }

    // Collect enquiry details
    const enquiry = {
      name: clean(body.name, 80),
      phone: clean(body.phone, 25),
      email: clean(body.email, 120),
      city: clean(body.city, 80),
      gender: clean(body.gender, 40),
      course: clean(body.course, 120),
      message: clean(body.message, 2000),
    };

    // Validate form
    const errors = {};

    if (enquiry.name.length < 2) {
      errors.name = "Enter your name.";
    }

    if (
      !phonePattern.test(enquiry.phone) ||
      enquiry.phone.replace(/\D/g, "").length < 10
    ) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!emailPattern.test(enquiry.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (enquiry.city.length < 2) {
      errors.city = "Enter your city.";
    }

    if (enquiry.gender.length < 2) {
      errors.gender = "Select your gender.";
    }

    if (enquiry.course.length < 2) {
      errors.course = "Select your course.";
    }

    if (enquiry.message.length < 5) {
      errors.message = "Enter a message.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please check the submitted details.",
        errors,
      });
    }

    // Save locally first
    const saved = await saveEnquiry(enquiry);

    const emailLines = [
      "A new enquiry was submitted through the Whitehouse website.",
      "",
      `Enquiry ID: ${saved.id}`,
      `Date: ${saved.createdAt.slice(0, 10)}`,
      `Name: ${saved.name}`,
      `Phone: ${saved.phone}`,
      `Email: ${saved.email}`,
      `City: ${saved.city}`,
      `Gender: ${saved.gender}`,
      `Course: ${saved.course}`,
      "",
      "Message:",
      saved.message,
    ];

    // Start email and Google Sheets together
    const emailTask = transporter
      ? transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: process.env.MAIL_TO,
          replyTo: {
            name: saved.name,
            address: saved.email,
          },
          subject: `Website enquiry - ${saved.course}`,
          text: emailLines.join("\n"),
        })
      : Promise.reject(new Error("Email is not configured."));

    const sheetTask = saveEnquiryToGoogleSheet(saved);

    const [emailResult, sheetResult] = await Promise.allSettled([
      emailTask,
      sheetTask,
    ]);

    const emailSent = emailResult.status === "fulfilled";
    const sheetSaved = sheetResult.status === "fulfilled";

    if (!emailSent) {
      console.error(
        "Email sending failed:",
        emailResult.reason?.message
      );
    }

    if (!sheetSaved) {
      console.error(
        "Google Sheets save failed:",
        sheetResult.reason?.message
      );
    }

    let message;

    if (emailSent && sheetSaved) {
      message =
        "Thank you! Your enquiry has been emailed and saved successfully.";
    } else if (emailSent) {
      message =
        "Your enquiry email was sent, but spreadsheet storage failed.";
    } else if (sheetSaved) {
      message =
        "Your enquiry was saved to the spreadsheet, but email sending failed.";
    } else {
      message =
        "Your enquiry was saved locally. Email and spreadsheet delivery need attention.";
    }

    return res.status(200).json({
      success: true,
      emailSent,
      sheetSaved,
      enquiryId: saved.id,
      message,
    });
  } catch (error) {
    console.error("Enquiry submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your enquiry. Please try again later.",
    });
  }
});

// Unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Central error handler
app.use((err, _req, res, _next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request.",
    });
  }

  console.error("Server error:", err);

  return res.status(500).json({
    success: false,
    message: "Unexpected server error.",
  });
});

// Start server
if (process.env.NODE_ENV !== "test") {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET are required for CMS functionality.");
  }
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => app.listen(PORT, () => console.log(`Whitehouse API running on port ${PORT}`)))
    .catch((error) => { console.error("MongoDB connection failed:", error); process.exit(1); });
}

export default app;
