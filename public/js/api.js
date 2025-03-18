// API Service for EduAI Platform

const API_URL = window.location.origin

// Helper function for making API requests
async function apiRequest(endpoint, method = "GET", data = null, token = null, formData = null) {
  const url = `${API_URL}${endpoint}`

  const headers = {
    Accept: "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (!formData && method !== "GET") {
    headers["Content-Type"] = "application/json"
  }

  const options = {
    method,
    headers,
    credentials: "include",
  }

  if (data && !formData) {
    options.body = JSON.stringify(data)
  } else if (formData) {
    options.body = formData
    // Don't set Content-Type for FormData, browser will set it with boundary
    delete headers["Content-Type"]
  }

  try {
    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong")
    }

    return result
  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
}

// Authentication functions
async function login(email, password, role) {
  try {
    const result = await apiRequest("/api/login", "POST", { email, password, role })

    if (result.success) {
      // Store token in localStorage
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))
    }

    return result
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: error.message }
  }
}

async function register(name, email, password, role) {
  try {
    const result = await apiRequest("/api/register", "POST", { name, email, password, role })
    return result
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, message: error.message }
  }
}

function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/index.html"
}

function getCurrentUser() {
  const userJson = localStorage.getItem("user")
  return userJson ? JSON.parse(userJson) : null
}

function getToken() {
  return localStorage.getItem("token")
}

function isLoggedIn() {
  return !!getToken() && !!getCurrentUser()
}

// Course functions
async function getCourses() {
  try {
    const token = getToken()
    const result = await apiRequest("/api/courses", "GET", null, token)
    return result.courses
  } catch (error) {
    console.error("Get courses error:", error)
    throw error
  }
}

async function getCourse(courseId) {
  try {
    const token = getToken()
    const result = await apiRequest(`/api/courses/${courseId}`, "GET", null, token)
    return result.course
  } catch (error) {
    console.error("Get course error:", error)
    throw error
  }
}

async function createCourse(name, code, description) {
  try {
    const token = getToken()
    const result = await apiRequest("/api/courses", "POST", { name, code, description }, token)
    return result
  } catch (error) {
    console.error("Create course error:", error)
    throw error
  }
}

// Enrollment functions
async function enrollStudent(courseId, studentId) {
  try {
    const token = getToken()
    const result = await apiRequest("/api/enrollments", "POST", { courseId, studentId }, token)
    return result
  } catch (error) {
    console.error("Enroll student error:", error)
    throw error
  }
}

async function unenrollStudent(courseId, studentId) {
  try {
    const token = getToken()
    const result = await apiRequest("/api/enrollments", "DELETE", { courseId, studentId }, token)
    return result
  } catch (error) {
    console.error("Unenroll student error:", error)
    throw error
  }
}

// Material functions
async function getMaterials(courseId) {
  try {
    const token = getToken()
    const result = await apiRequest(`/api/courses/${courseId}/materials`, "GET", null, token)
    return result.materials
  } catch (error) {
    console.error("Get materials error:", error)
    throw error
  }
}

async function addMaterial(courseId, title, description, type, content, file = null) {
  try {
    const token = getToken()

    // Use FormData for file uploads
    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("type", type)
    formData.append("content", content)

    if (file) {
      formData.append("file", file)
    }

    const result = await apiRequest(`/api/courses/${courseId}/materials`, "POST", null, token, formData)
    return result
  } catch (error) {
    console.error("Add material error:", error)
    throw error
  }
}

// Assignment functions
async function getAssignments(courseId) {
  try {
    const token = getToken()
    const result = await apiRequest(`/api/courses/${courseId}/assignments`, "GET", null, token)
    return result.assignments
  } catch (error) {
    console.error("Get assignments error:", error)
    throw error
  }
}

async function createAssignment(courseId, title, description, dueDate, estimatedTime, type, questions) {
  try {
    const token = getToken()
    const result = await apiRequest(
      `/api/courses/${courseId}/assignments`,
      "POST",
      { title, description, dueDate, estimatedTime, type, questions },
      token,
    )
    return result
  } catch (error) {
    console.error("Create assignment error:", error)
    throw error
  }
}

// Submission functions
async function getSubmissions(assignmentId) {
  try {
    const token = getToken()
    const result = await apiRequest(`/api/assignments/${assignmentId}/submissions`, "GET", null, token)
    return result.submissions
  } catch (error) {
    console.error("Get submissions error:", error)
    throw error
  }
}

async function submitAssignment(assignmentId, answers, files = []) {
  try {
    const token = getToken()

    // Use FormData for file uploads
    const formData = new FormData()

    // Add files
    files.forEach((file, index) => {
      if (file) {
        formData.append("files", file)
      }
    })

    // Add answers with file references
    const answersWithFileIndices = answers.map((answer, index) => {
      if (files[index]) {
        return { ...answer, fileIndex: index }
      }
      return answer
    })

    formData.append("answers", JSON.stringify(answersWithFileIndices))

    const result = await apiRequest(`/api/assignments/${assignmentId}/submissions`, "POST", null, token, formData)
    return result
  } catch (error) {
    console.error("Submit assignment error:", error)
    throw error
  }
}

// Evaluation functions
async function evaluateSubmission(submissionId, score, feedback, strengths, weaknesses) {
  try {
    const token = getToken()
    const result = await apiRequest(
      `/api/submissions/${submissionId}/evaluate`,
      "POST",
      { score, feedback, strengths, weaknesses },
      token,
    )
    return result
  } catch (error) {
    console.error("Evaluate submission error:", error)
    throw error
  }
}

// AI functions
async function simplifyMaterial(materialId) {
  try {
    const token = getToken()
    const result = await apiRequest("/api/ai/simplify-material", "POST", { materialId }, token)
    return result.material
  } catch (error) {
    console.error("Simplify material error:", error)
    throw error
  }
}

async function generateQuestions(materialId, count = 5) {
  try {
    const token = getToken()
    const result = await apiRequest("/api/ai/generate-questions", "POST", { materialId, count }, token)
    return result.questions
  } catch (error) {
    console.error("Generate questions error:", error)
    throw error
  }
}

async function autoEvaluate(submissionId) {
  try {
    const token = getToken()
    const result = await apiRequest("/api/ai/auto-evaluate", "POST", { submissionId }, token)
    return result.evaluation
  } catch (error) {
    console.error("Auto evaluate error:", error)
    throw error
  }
}

// Performance functions
async function getPerformance(studentId) {
  try {
    const token = getToken()
    const result = await apiRequest(`/api/students/${studentId}/performance`, "GET", null, token)
    return result.performance
  } catch (error) {
    console.error("Get performance error:", error)
    throw error
  }
}

// Export all functions
window.EduAPI = {
  login,
  register,
  logout,
  getCurrentUser,
  isLoggedIn,
  getCourses,
  getCourse,
  createCourse,
  enrollStudent,
  unenrollStudent,
  getMaterials,
  addMaterial,
  getAssignments,
  createAssignment,
  getSubmissions,
  submitAssignment,
  evaluateSubmission,
  simplifyMaterial,
  generateQuestions,
  autoEvaluate,
  getPerformance,
}

