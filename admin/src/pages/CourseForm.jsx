
import React, { useEffect, useState } from "react";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001";

const initialForm = {
  title: "",
  slug: "",
  category: "coding",
  categoryLabel: "",
  summary: "",
  image: "",
  alt: "",
  level: "Beginner",
  duration: "",
  mode: "Offline",
  batch: "",
  language: "English & Tamil",
  certificate: "",
  intro: "",
  outcomes: "",
  skills: "",
  eligibility: "",
  careers: "",
  status: "draft",
};

const arrayFields = [
  "outcomes",
  "skills",
  "eligibility",
  "careers",
];

const toArray = (value) =>
  Array.isArray(value) ? value.join("\n") : "";

const CourseForm = ({ course, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!course) {
      setForm(initialForm);
      return;
    }

    setForm({
      ...initialForm,
      ...course,
      intro: toArray(course.intro),
      outcomes: toArray(course.outcomes),
      skills: toArray(course.skills),
      eligibility: toArray(course.eligibility),
      careers: toArray(course.careers),
    });
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !course
        ? {
            slug: value
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
          }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("adminToken");

      const payload = {
        ...form,
        intro: form.intro
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        ...Object.fromEntries(
          arrayFields.map((field) => [
            field,
            form[field]
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          ])
        ),
      };

      const isEditing = Boolean(course?._id);

      const response = await fetch(
        `${API_URL}/api/admin/courses${
          isEditing ? `/${course._id}` : ""
        }`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to save course.");
      }

      setMessage(
        isEditing
          ? "Course updated successfully!"
          : "Course created successfully!"
      );

      if (!isEditing) {
        setForm(initialForm);
      }

      onSuccess?.(result);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const input = (label, name, placeholder = "", type = "text") => (
    <div className="course-form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required={["title", "slug", "duration"].includes(name)}
      />
    </div>
  );

  const textarea = (label, name, placeholder) => (
    <div className="course-form-group">
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        rows="4"
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
      />
      <small>Enter each item on a new line.</small>
    </div>
  );

  return (
    <div className="course-form-page">
      <div className="course-form-heading">
        <div>
          <h1>{course ? "Edit Course" : "Create Course"}</h1>
          <p>Manage your Whitehouse course information.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="course-form-section">
          <h2>Basic Information</h2>

          {input("Course Title", "title", "Enter course title")}
          {input("Course Slug", "slug", "course-slug")}
          {input("Category", "category", "coding")}
          {input("Category Label", "categoryLabel", "Coding")}

          {textarea(
            "Short Description / Summary",
            "summary",
            "Enter a short course description"
          )}

          {input("Course Image URL", "image", "Paste image URL")}
          {input("Image Alt Text", "alt", "Describe the course image")}
        </section>

        <section className="course-form-section">
          <h2>Course Information</h2>

          <div className="course-form-grid">
            <div className="course-form-group">
              <label>Level</label>
              <select name="level" value={form.level} onChange={handleChange}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Beginner to Advanced</option>
              </select>
            </div>

            <div className="course-form-group">
              <label>Learning Mode</label>
              <select name="mode" value={form.mode} onChange={handleChange}>
                <option>Offline</option>
                <option>Online</option>
                <option>Hybrid</option>
              </select>
            </div>
          </div>

          {input("Duration", "duration", "Example: 6 Months")}
          {input("Batch", "batch", "Weekday & Weekend")}
          {input("Language", "language", "English & Tamil")}
          {input("Certificate", "certificate", "Course completion certificate")}
        </section>

        <section className="course-form-section">
          <h2>Course Details</h2>

          {textarea(
            "Course Introduction",
            "intro",
            "Write each introduction paragraph on a new line."
          )}

          {textarea(
            "What You Will Learn",
            "outcomes",
            "Build responsive websites\nDevelop React applications"
          )}

          {textarea(
            "Skills You Will Build",
            "skills",
            "HTML\nCSS\nJavaScript\nReact.js"
          )}

          {textarea(
            "Eligibility Criteria",
            "eligibility",
            "Basic computer knowledge\nInterest in programming"
          )}

          {textarea(
            "Career Opportunities",
            "careers",
            "Frontend Developer\nBackend Developer\nFull Stack Developer"
          )}
        </section>

        <section className="course-form-section">
          <h2>Publishing</h2>

          <div className="course-form-group">
            <label>Course Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </section>

        {message && <p role="status">{message}</p>}

        <div className="course-form-actions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : course
              ? "Update Course"
              : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
