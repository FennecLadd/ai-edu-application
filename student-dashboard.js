import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!window.EduAI || !window.EduAI.isLoggedIn()) {
    window.location.href = "index.html"
    return
  }

  const currentUser = window.EduAI.getCurrentUser()

  // Verify user is a student
  if (currentUser.role !== "student") {
    window.location.href = `${currentUser.role}-dashboard.html`
    return
  }

  // Update user info in the UI
  updateUserInfo(currentUser)

  // Load student data
  loadStudentDashboard(currentUser.id)

  // Set up event listeners
  setupEventListeners()

  // Initialize performance chart
  initializePerformanceChart()

  // Setup logout functionality
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.EduAI.logout()
    })
  })
})

function updateUserInfo(user) {
  // Update user avatar and name
  const userAvatars = document.querySelectorAll(".user-avatar")
  const userNames = document.querySelectorAll(".user-name")

  userAvatars.forEach((avatar) => {
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
    if (avatar.tagName === "DIV") {
      avatar.innerHTML = `<span class="text-white font-medium">${initials}</span>`
    }
  })

  userNames.forEach((nameElement) => {
    nameElement.textContent = user.name
  })
}

function loadStudentDashboard(studentId) {
  // Get student's courses
  const courses = window.EduAI.getCoursesByUser(studentId, "student")

  // Get student's performance data
  const performanceData = window.EduAI.getPerformanceByStudent(studentId)

  // Get student's submissions
  const submissions = window.EduAI.getSubmissionsByStudent(studentId)

  // Update UI with data
  updateCoursesSection(courses)
  updateAssignmentsSection(courses, submissions)
  updateMaterialsSection(courses)
  updatePerformanceSection(performanceData)
}

function updateCoursesSection(courses) {
  const coursesContainer = document.querySelector("#courses-container")
  if (!coursesContainer) return

  let coursesHTML = ""

  courses.forEach((course) => {
    // Get random progress for demo
    const progress = Math.floor(Math.random() * 80) + 20

    // Get faculty name
    const faculty = window.EduAI.users.faculty.find((f) => f.id === course.faculty)
    const facultyName = faculty ? faculty.name : "Unknown Instructor"

    coursesHTML += `
            <div class="bg-gray-900 rounded-lg p-4 border-l-4 border-purple-500">
                <h3 class="font-semibold text-white">${course.name}</h3>
                <p class="text-gray-400 text-sm">${facultyName}</p>
                <div class="mt-2 flex justify-between items-center">
                    <span class="text-xs text-gray-500">Progress: ${progress}%</span>
                    <div class="w-32 bg-gray-700 rounded-full h-2">
                        <div class="bg-purple-500 h-2 rounded-full" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `
  })

  coursesContainer.innerHTML = coursesHTML
}

function updateAssignmentsSection(courses, submissions) {
  const assignmentsContainer = document.querySelector("#assignments-container")
  if (!assignmentsContainer) return

  let assignmentsHTML = ""

  // Get all assignments for the student's courses
  const courseIds = courses.map((c) => c.id)
  const allAssignments = []

  courseIds.forEach((courseId) => {
    const courseAssignments = window.EduAI.getAssignmentsByCourse(courseId)
    allAssignments.push(...courseAssignments)
  })

  // Sort by due date (closest first)
  allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  // Take only the first 3 (upcoming)
  const upcomingAssignments = allAssignments.slice(0, 3)

  upcomingAssignments.forEach((assignment) => {
    const course = courses.find((c) => c.id === assignment.courseId)
    const courseName = course ? course.name : "Unknown Course"

    // Check if already submitted
    const isSubmitted = submissions.some((s) => s.assignmentId === assignment.id)

    // Calculate days until due
    const dueDate = new Date(assignment.dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

    let dueDateClass = "text-green-400"
    let dueDateText = `Due in ${daysUntilDue} days`

    if (daysUntilDue <= 1) {
      dueDateClass = "text-red-400"
      dueDateText = daysUntilDue === 1 ? "Due Tomorrow" : "Due Today"
    } else if (daysUntilDue <= 3) {
      dueDateClass = "text-yellow-400"
    }

    if (isSubmitted) {
      dueDateClass = "text-blue-400"
      dueDateText = "Submitted"
    }

    assignmentsHTML += `
            <div class="bg-gray-900 rounded-lg p-4 border-l-4 ${isSubmitted ? "border-blue-500" : "border-" + (daysUntilDue <= 1 ? "red" : daysUntilDue <= 3 ? "yellow" : "green") + "-500"}">
                <div class="flex justify-between">
                    <h3 class="font-semibold text-white">${assignment.title}</h3>
                    <span class="text-xs ${dueDateClass} font-semibold">${dueDateText}</span>
                </div>
                <p class="text-gray-400 text-sm">${courseName}</p>
                <div class="mt-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-xs text-gray-500">${assignment.estimatedTime} minutes estimated time</span>
                </div>
            </div>
        `
  })

  assignmentsContainer.innerHTML = assignmentsHTML
}

function updateMaterialsSection(courses) {
  const materialsContainer = document.querySelector("#materials-container")
  if (!materialsContainer) return

  // Get all materials for the student's courses
  const courseIds = courses.map((c) => c.id)
  const allMaterials = []

  courseIds.forEach((courseId) => {
    const courseMaterials = window.EduAI.getMaterialsByCourse(courseId)
    allMaterials.push(...courseMaterials)
  })

  // Sort by date added (newest first)
  allMaterials.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))

  // Take only the first 3 (most recent)
  const recentMaterials = allMaterials.slice(0, 3)

  let materialsHTML = ""

  recentMaterials.forEach((material) => {
    const course = courses.find((c) => c.id === material.courseId)
    const courseName = course ? course.name : "Unknown Course"

    // Calculate days since added
    const addedDate = new Date(material.dateAdded)
    const today = new Date()
    const daysSinceAdded = Math.floor((today - addedDate) / (1000 * 60 * 60 * 24))

    let addedText = "Added today"
    if (daysSinceAdded === 1) {
      addedText = "Added yesterday"
    } else if (daysSinceAdded > 1) {
      addedText = `Added ${daysSinceAdded} days ago`
    }

    // Determine material type icon and gradient
    let typeIcon = ""
    let gradient = ""
    let typeLabel = ""
    let actionText = ""

    if (material.type === "pdf") {
      typeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>`
      gradient = "from-purple-900 to-blue-900"
      typeLabel = "PDF Document"
      actionText = "View Material"
    } else if (material.type === "video") {
      typeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>`
      gradient = "from-blue-900 to-indigo-900"
      typeLabel = "Video Lecture"
      actionText = "Watch Video"
    } else if (material.type === "interactive") {
      typeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>`
      gradient = "from-green-900 to-teal-900"
      typeLabel = "Interactive Tutorial"
      actionText = "Start Tutorial"
    }

    materialsHTML += `
            <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg hover:shadow-xl transition duration-300">
                <div class="h-40 bg-gradient-to-r ${gradient} flex items-center justify-center">
                    ${typeIcon}
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-semibold text-blue-400">${typeLabel}</span>
                        <span class="text-xs text-gray-500">${addedText}</span>
                    </div>
                    <h3 class="font-bold text-white mb-1">${material.title}</h3>
                    <p class="text-gray-400 text-sm mb-3">${material.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-500">${courseName}</span>
                        <button class="text-blue-400 hover:text-blue-300 text-sm font-medium view-material" data-id="${material.id}">
                            ${actionText}
                        </button>
                    </div>
                </div>
            </div>
        `
  })

  materialsContainer.innerHTML = materialsHTML

  // Add event listeners to material buttons
  document.querySelectorAll(".view-material").forEach((btn) => {
    btn.addEventListener("click", function () {
      const materialId = Number.parseInt(this.getAttribute("data-id"))
      viewMaterial(materialId)
    })
  })
}

function updatePerformanceSection(performanceData) {
  if (!performanceData) return

  // Update AI insights
  const insightsContainer = document.querySelector("#ai-insights")
  if (insightsContainer) {
    let insightsHTML = ""

    // Combine insights from all courses
    const strengths = new Set()
    const weaknesses = new Set()
    const recommendations = new Set()

    performanceData.courses.forEach((course) => {
      course.strengths.forEach((s) => strengths.add(s))
      course.weaknesses.forEach((w) => weaknesses.add(w))
      course.recommendations.forEach((r) => recommendations.add(r))
    })

    // Add a strength
    if (strengths.size > 0) {
      const strength = Array.from(strengths)[0]
      insightsHTML += `
                <li class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-gray-300">Strong in ${strength}</span>
                </li>
            `
    }

    // Add a weakness
    if (weaknesses.size > 0) {
      const weakness = Array.from(weaknesses)[0]
      insightsHTML += `
                <li class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="text-gray-300">Need improvement in ${weakness}</span>
                </li>
            `
    }

    // Add a recommendation
    if (recommendations.size > 0) {
      const recommendation = Array.from(recommendations)[0]
      insightsHTML += `
                <li class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-gray-300">Recommended: ${recommendation}</span>
                </li>
            `
    }

    insightsContainer.innerHTML = insightsHTML
  }
}

function initializePerformanceChart() {
  const ctx = document.getElementById("performanceChart")
  if (!ctx) return

  const currentUser = window.EduAI.getCurrentUser()
  const performanceData = window.EduAI.getPerformanceByStudent(currentUser.id)

  if (!performanceData) return

  const courses = window.EduAI.getCoursesByUser(currentUser.id, "student")

  const datasets = []
  const colors = [
    { border: "rgb(139, 92, 246)", background: "rgba(139, 92, 246, 0.1)" },
    { border: "rgb(59, 130, 246)", background: "rgba(59, 130, 246, 0.1)" },
    { border: "rgb(16, 185, 129)", background: "rgba(16, 185, 129, 0.1)" },
  ]

  performanceData.courses.forEach((coursePerf, index) => {
    const course = courses.find((c) => c.id === coursePerf.courseId)
    if (course) {
      datasets.push({
        label: course.name,
        data: coursePerf.weeklyScores,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].background,
        tension: 0.3,
        fill: true,
      })
    }
  })

  const performanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      datasets: datasets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgb(209, 213, 219)",
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "rgb(209, 213, 219)",
          },
          grid: {
            color: "rgba(75, 85, 99, 0.2)",
          },
        },
        x: {
          ticks: {
            color: "rgb(209, 213, 219)",
          },
          grid: {
            color: "rgba(75, 85, 99, 0.2)",
          },
        },
      },
    },
  })
}

function setupEventListeners() {
  // View all courses button
  const viewAllCoursesBtn = document.querySelector("#view-all-courses")
  if (viewAllCoursesBtn) {
    viewAllCoursesBtn.addEventListener("click", () => {
      showCoursesModal()
    })
  }

  // View all assignments button
  const viewAllAssignmentsBtn = document.querySelector("#view-all-assignments")
  if (viewAllAssignmentsBtn) {
    viewAllAssignmentsBtn.addEventListener("click", () => {
      showAssignmentsModal()
    })
  }

  // View detailed analytics button
  const viewAnalyticsBtn = document.querySelector("#view-analytics")
  if (viewAnalyticsBtn) {
    viewAnalyticsBtn.addEventListener("click", () => {
      showAnalyticsModal()
    })
  }

  // AI study assistant buttons
  const simplifyMaterialBtn = document.querySelector("#simplify-material")
  if (simplifyMaterialBtn) {
    simplifyMaterialBtn.addEventListener("click", () => {
      showSimplifyMaterialModal()
    })
  }

  const generateQuestionsBtn = document.querySelector("#generate-questions")
  if (generateQuestionsBtn) {
    generateQuestionsBtn.addEventListener("click", () => {
      showGenerateQuestionsModal()
    })
  }

  const askQuestionBtn = document.querySelector("#ask-question")
  if (askQuestionBtn) {
    askQuestionBtn.addEventListener("click", () => {
      showAskQuestionModal()
    })
  }
}

// Modal functions
function showCoursesModal() {
  const currentUser = window.EduAI.getCurrentUser()
  const courses = window.EduAI.getCoursesByUser(currentUser.id, "student")

  let coursesHTML = ""

  courses.forEach((course) => {
    // Get random progress for demo
    const progress = Math.floor(Math.random() * 80) + 20

    // Get faculty name
    const faculty = window.EduAI.users.faculty.find((f) => f.id === course.faculty)
    const facultyName = faculty ? faculty.name : "Unknown Instructor"

    coursesHTML += `
            <div class="bg-gray-800 rounded-lg p-4 mb-4 border-l-4 border-purple-500">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-white text-lg">${course.name}</h3>
                        <p class="text-gray-400">${course.code}</p>
                        <p class="text-gray-400 text-sm mt-1">Instructor: ${facultyName}</p>
                        <p class="text-gray-400 text-sm mt-2">${course.description}</p>
                    </div>
                    <span class="bg-purple-900 text-purple-200 px-2 py-1 rounded-full text-xs">Progress: ${progress}%</span>
                </div>
                <div class="mt-4">
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-purple-500 h-2 rounded-full" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="mt-4 flex space-x-2">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded-lg transition duration-300 view-course-materials" data-id="${course.id}">
                        View Materials
                    </button>
                    <button class="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded-lg transition duration-300 view-course-assignments" data-id="${course.id}">
                        View Assignments
                    </button>
                </div>
            </div>
        `
  })

  const modal = createModal("My Courses", coursesHTML)
  document.body.appendChild(modal)

  // Add event listeners
  document.querySelectorAll(".view-course-materials").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-id"))
      document.body.removeChild(modal)
      showCourseMaterialsModal(courseId)
    })
  })

  document.querySelectorAll(".view-course-assignments").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-id"))
      document.body.removeChild(modal)
      showCourseAssignmentsModal(courseId)
    })
  })
}

function showAssignmentsModal() {
  const currentUser = window.EduAI.getCurrentUser()
  const courses = window.EduAI.getCoursesByUser(currentUser.id, "student")
  const submissions = window.EduAI.getSubmissionsByStudent(currentUser.id)

  // Get all assignments for the student's courses
  const courseIds = courses.map((c) => c.id)
  const allAssignments = []

  courseIds.forEach((courseId) => {
    const courseAssignments = window.EduAI.getAssignmentsByCourse(courseId)
    allAssignments.push(...courseAssignments)
  })

  // Sort by due date (closest first)
  allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  let assignmentsHTML = ""

  allAssignments.forEach((assignment) => {
    const course = courses.find((c) => c.id === assignment.courseId)
    const courseName = course ? course.name : "Unknown Course"

    // Check if already submitted
    const submission = submissions.find((s) => s.assignmentId === assignment.id)
    const isSubmitted = !!submission

    // Calculate days until due
    const dueDate = new Date(assignment.dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

    let statusClass = "bg-green-900 text-green-200"
    let statusText = `Due in ${daysUntilDue} days`

    if (daysUntilDue <= 1) {
      statusClass = "bg-red-900 text-red-200"
      statusText = daysUntilDue === 1 ? "Due Tomorrow" : "Due Today"
    } else if (daysUntilDue <= 3) {
      statusClass = "bg-yellow-900 text-yellow-200"
    }

    if (isSubmitted) {
      statusClass = "bg-blue-900 text-blue-200"
      statusText =
        submission.status === "graded" ? `Graded: ${submission.evaluation.score}%` : "Submitted - Pending Review"
    }

    assignmentsHTML += `
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-white text-lg">${assignment.title}</h3>
                        <p class="text-gray-400">${courseName}</p>
                        <p class="text-gray-400 text-sm mt-1">${assignment.description}</p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs ${statusClass}">${statusText}</span>
                </div>
                <div class="mt-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-xs text-gray-500">${assignment.estimatedTime} minutes estimated time</span>
                </div>
                <div class="mt-4">
                    ${
                      isSubmitted
                        ? `<button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded-lg transition duration-300 view-submission" data-id="${submission.id}">
                            View Submission
                        </button>`
                        : `<button class="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-1 px-3 rounded-lg transition duration-300 submit-assignment" data-id="${assignment.id}">
                            Submit Assignment
                        </button>`
                    }
                </div>
            </div>
        `
  })

  const modal = createModal("My Assignments", assignmentsHTML)
  document.body.appendChild(modal)

  // Add event listeners
  document.querySelectorAll(".view-submission").forEach((btn) => {
    btn.addEventListener("click", function () {
      const submissionId = Number.parseInt(this.getAttribute("data-id"))
      document.body.removeChild(modal)
      showSubmissionModal(submissionId)
    })
  })

  document.querySelectorAll(".submit-assignment").forEach((btn) => {
    btn.addEventListener("click", function () {
      const assignmentId = Number.parseInt(this.getAttribute("data-id"))
      document.body.removeChild(modal)
      showSubmitAssignmentModal(assignmentId)
    })
  })
}

function showAnalyticsModal() {
  const currentUser = window.EduAI.getCurrentUser()
  const performanceData = window.EduAI.getPerformanceByStudent(currentUser.id)

  if (!performanceData) {
    showNotification("No performance data available", "error")
    return
  }

  const courses = window.EduAI.getCoursesByUser(currentUser.id, "student")

  let analyticsHTML = `
        <div class="mb-6">
            <canvas id="detailedPerformanceChart" height="200"></canvas>
        </div>
    `

  // Add strengths and weaknesses for each course
  performanceData.courses.forEach((coursePerf) => {
    const course = courses.find((c) => c.id === coursePerf.courseId)
    if (!course) return

    analyticsHTML += `
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-white text-lg">${course.name}</h3>
                <div class="grid grid-cols-2 gap-4 mt-3">
                    <div>
                        <h4 class="text-green-400 font-medium mb-2">Strengths</h4>
                        <ul class="space-y-1">
                            ${coursePerf.strengths
                              .map(
                                (strength) => `
                                <li class="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span class="text-gray-300">${strength}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-yellow-400 font-medium mb-2">Areas for Improvement</h4>
                        <ul class="space-y-1">
                            ${coursePerf.weaknesses
                              .map(
                                (weakness) => `
                                <li class="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span class="text-gray-300">${weakness}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                </div>
                <div class="mt-4">
                    <h4 class="text-blue-400 font-medium mb-2">Recommendations</h4>
                    <ul class="space-y-1">
                        ${coursePerf.recommendations
                          .map(
                            (recommendation) => `
                            <li class="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="text-gray-300">${recommendation}</span>
                            </li>
                        `,
                          )
                          .join("")}
                    </ul>
                </div>
            </div>
        `
  })

  const modal = createModal("Performance Analytics", analyticsHTML)
  document.body.appendChild(modal)

  // Initialize detailed performance chart
  setTimeout(() => {
    const ctx = document.getElementById("detailedPerformanceChart")
    if (!ctx) return

    const datasets = []
    const colors = [
      { border: "rgb(139, 92, 246)", background: "rgba(139, 92, 246, 0.1)" },
      { border: "rgb(59, 130, 246)", background: "rgba(59, 130, 246, 0.1)" },
      { border: "rgb(16, 185, 129)", background: "rgba(16, 185, 129, 0.1)" },
    ]

    performanceData.courses.forEach((coursePerf, index) => {
      const course = courses.find((c) => c.id === coursePerf.courseId)
      if (course) {
        datasets.push({
          label: course.name,
          data: coursePerf.weeklyScores,
          borderColor: colors[index % colors.length].border,
          backgroundColor: colors[index % colors.length].background,
          tension: 0.3,
          fill: true,
        })
      }
    })

    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "rgb(209, 213, 219)",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: "rgb(209, 213, 219)",
            },
            grid: {
              color: "rgba(75, 85, 99, 0.2)",
            },
          },
          x: {
            ticks: {
              color: "rgb(209, 213, 219)",
            },
            grid: {
              color: "rgba(75, 85, 99, 0.2)",
            },
          },
        },
      },
    })
  }, 100)
}

function showSimplifyMaterialModal() {
  const currentUser = window.EduAI.getCurrentUser()
  const courses = window.EduAI.getCoursesByUser(currentUser.id, "student")

  // Get all materials for the student's courses
  const courseIds = courses.map((c) => c.id)
  const allMaterials = []

  courseIds.forEach((courseId) => {
    const courseMaterials = window.EduAI.getMaterialsByCourse(courseId)
    allMaterials.push(...courseMaterials)
  })

  let materialsHTML = `
        <p class="text-gray-300 mb-4">Select a material to simplify:</p>
        <div class="space-y-2 max-h-60 overflow-y-auto mb-4">
    `

  allMaterials.forEach((material) => {
    const course = courses.find((c) => c.id === material.courseId)
    const courseName = course ? course.name : "Unknown Course"

    materialsHTML += `
            <div class="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition duration-200 select-material" data-id="${material.id}">
                <h4 class="font-medium text-white">${material.title}</h4>
                <p class="text-gray-400 text-sm">${courseName}</p>
            </div>
        `
  })

  materialsHTML += `
        </div>
        <div id="simplification-result" class="hidden">
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-white text-lg mb-2">Simplified Content</h3>
                <div class="bg-gray-900 p-4 rounded-lg">
                    <p class="text-gray-300" id="simplified-content"></p>
                </div>
            </div>
        </div>
    `

  const modal = createModal("Simplify Material", materialsHTML)
  document.body.appendChild(modal)

  // Add event listeners
  document.querySelectorAll(".select-material").forEach((element) => {
    element.addEventListener("click", function () {
      const materialId = Number.parseInt(this.getAttribute("data-id"))

      // Show loading state
      this.innerHTML += `
                <div class="mt-2 flex items-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    <span class="text-purple-400 text-sm">Simplifying...</span>
                </div>
            `

      // Simulate AI processing delay
      setTimeout(() => {
        const simplifiedMaterial = window.EduAI.simplifyMaterial(materialId)

        if (simplifiedMaterial) {
          document.getElementById("simplified-content").textContent = simplifiedMaterial.content
          document.getElementById("simplification-result").classList.remove("hidden")

          // Remove loading state and mark as simplified
          this.innerHTML = `
                        <h4 class="font-medium text-white">${simplifiedMaterial.title}</h4>
                        <p class="text-gray-400 text-sm">${courses.find((c) => c.id === simplifiedMaterial.courseId)?.name || "Unknown Course"}</p>
                        <span class="text-green-400 text-xs">✓ Simplified</span>
                    `
        }
      }, 1500)
    })
  })
}

function showGenerateQuestionsModal() {
  const currentUser = window.EduAI.getCurrentUser()
  const courses = window.EduAI.getCoursesByUser(currentUser.id, "student")

  // Get all materials for the student's courses
  const courseIds = courses.map((c) => c.id)
  const allMaterials = []

  courseIds.forEach((courseId) => {
    const courseMaterials = window.EduAI.getMaterialsByCourse(courseId)
    allMaterials.push(...courseMaterials)
  })

  let materialsHTML = `
        <p class="text-gray-300 mb-4">Select a material to generate practice questions:</p>
        <div class="space-y-2 max-h-60 overflow-y-auto mb-4">
    `

  allMaterials.forEach((material) => {
    const course = courses.find((c) => c.id === material.courseId)
    const courseName = course ? course.name : "Unknown Course"

    materialsHTML += `
            <div class="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition duration-200 select-material-for-questions" data-id="${material.id}">
                <h4 class="font-medium text-white">${material.title}</h4>
                <p class="text-gray-400 text-sm">${courseName}</p>
            </div>
        `
  })

  materialsHTML += `
        </div>
        <div id="questions-result" class="hidden">
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-white text-lg mb-2">Practice Questions</h3>
                <div id="generated-questions" class="space-y-4"></div>
            </div>
        </div>
    `

  const modal = createModal("Generate Practice Questions", materialsHTML)
  document.body.appendChild(modal)

  // Add event listeners
  document.querySelectorAll(".select-material-for-questions").forEach((element) => {
    element.addEventListener("click", function () {
      const materialId = Number.parseInt(this.getAttribute("data-id"))

      // Show loading state
      this.innerHTML += `
                <div class="mt-2 flex items-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    <span class="text-purple-400 text-sm">Generating questions...</span>
                </div>
            `

      // Simulate AI processing delay
      setTimeout(() => {
        const questions = window.EduAI.generateQuestions(materialId)

        if (questions && questions.length > 0) {
          let questionsHTML = ""

          questions.forEach((question, index) => {
            questionsHTML += `
                            <div class="bg-gray-900 p-4 rounded-lg">
                                <p class="text-white font-medium mb-2">Question ${index + 1}: ${question.text}</p>
                                ${
                                  question.type === "multiple_choice"
                                    ? `
                                    <div class="space-y-2 mt-3">
                                        ${question.options
                                          .map(
                                            (option, i) => `
                                            <div class="flex items-center">
                                                <input type="radio" id="q${index}_option${i}" name="question${index}" class="mr-2">
                                                <label for="q${index}_option${i}" class="text-gray-300">${option}</label>
                                            </div>
                                        `,
                                          )
                                          .join("")}
                                    </div>
                                `
                                    : `
                                    <textarea class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mt-2" rows="3" placeholder="Enter your answer here..."></textarea>
                                `
                                }
                            </div>
                        `
          })

          document.getElementById("generated-questions").innerHTML = questionsHTML
          document.getElementById("questions-result").classList.remove("hidden")

          // Remove loading state and mark as generated
          this.innerHTML = `
                        <h4 class="font-medium text-white">${window.EduAI.materials.find((m) => m.id === materialId)?.title}</h4>
                        <p class="text-gray-400 text-sm">${courses.find((c) => c.id === window.EduAI.materials.find((m) => m.id === materialId)?.courseId)?.name || "Unknown Course"}</p>
                        <span class="text-green-400 text-xs">✓ Questions Generated</span>
                    `
        }
      }, 1500)
    })
  })
}

function showAskQuestionModal() {
  const askQuestionHTML = `
        <p class="text-gray-300 mb-4">Ask a question about any topic in your courses:</p>
        <textarea class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mb-4" rows="4" id="question-input" placeholder="Type your question here..."></textarea>
        <button id="submit-question" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 w-full">
            Ask Question
        </button>
        <div id="question-answer" class="hidden mt-4">
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="font-semibold text-white text-lg mb-2">Answer</h3>
                <div class="bg-gray-900 p-4 rounded-lg">
                    <p class="text-gray-300" id="ai-answer"></p>
                </div>
            </div>
        </div>
    `

  const modal = createModal("Ask a Question", askQuestionHTML)
  document.body.appendChild(modal)

  // Add event listener
  document.getElementById("submit-question").addEventListener("click", function () {
    const question = document.getElementById("question-input").value.trim()

    if (!question) {
      window.showNotification("Please enter a question", "error")
      return
    }

    // Show loading state
    this.disabled = true
    this.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Processing...</span>
            </div>
        `

    // Simulate AI processing delay
    setTimeout(() => {
      // Generate a response based on the question
      let answer = ""

      if (question.toLowerCase().includes("matrix")) {
        answer =
          "A matrix is a rectangular array of numbers, symbols, or expressions, arranged in rows and columns. Matrices are used in linear algebra to represent linear transformations and can be added, subtracted, and multiplied according to specific rules."
      } else if (question.toLowerCase().includes("neural network")) {
        answer =
          "Neural networks are computing systems inspired by the biological neural networks in animal brains. They consist of artificial neurons that can learn from and make decisions based on input data. Deep learning is a subset of machine learning that uses neural networks with many layers."
      } else if (question.toLowerCase().includes("algorithm")) {
        answer =
          "An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. In computer science, algorithms are used to process data, perform calculations, and automate reasoning. Common algorithms include sorting algorithms, search algorithms, and graph algorithms."
      } else {
        answer =
          "Based on your question, I would recommend reviewing the course materials on this topic. The key concepts involved relate to fundamental principles in your course. Would you like me to simplify any specific part of this topic?"
      }

      document.getElementById("ai-answer").textContent = answer
      document.getElementById("question-answer").classList.remove("hidden")

      // Reset button
      this.disabled = false
      this.textContent = "Ask Another Question"
    }, 2000)
  })
}

function viewMaterial(materialId) {
  const material = window.EduAI.materials.find((m) => m.id === materialId)
  if (!material) return

  const course = window.EduAI.courses.find((c) => c.id === material.courseId)
  const courseName = course ? course.name : "Unknown Course"

  const materialHTML = `
        <div class="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 class="font-semibold text-white text-lg">${material.title}</h3>
            <p class="text-gray-400">${courseName}</p>
            <div class="mt-4 bg-gray-900 p-4 rounded-lg">
                <p class="text-gray-300">${material.content}</p>
            </div>
        </div>
        <div class="flex space-x-2">
            <button id="simplify-this-material" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex-1">
                Simplify This Material
            </button>
            <button id="generate-questions-for-this" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex-1">
                Generate Practice Questions
            </button>
        </div>
    `

  const modal = createModal(
    material.type === "pdf" ? "PDF Document" : material.type === "video" ? "Video Lecture" : "Interactive Tutorial",
    materialHTML,
  )
  document.body.appendChild(modal)

  // Add event listeners
  document.getElementById("simplify-this-material").addEventListener("click", () => {
    document.body.removeChild(modal)

    // Create a new modal with simplified content
    const simplifiedMaterial = window.EduAI.simplifyMaterial(materialId)

    const simplifiedHTML = `
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-white text-lg">${material.title} (Simplified)</h3>
                <p class="text-gray-400">${courseName}</p>
                <div class="mt-4 bg-gray-900 p-4 rounded-lg">
                    <p class="text-gray-300">${simplifiedMaterial.content}</p>
                </div>
            </div>
        `

    const simplifiedModal = createModal("Simplified Material", simplifiedHTML)
    document.body.appendChild(simplifiedModal)
  })

  document.getElementById("generate-questions-for-this").addEventListener("click", () => {
    document.body.removeChild(modal)

    // Create a new modal with practice questions
    const questions = window.EduAI.generateQuestions(materialId)

    let questionsHTML = `
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-white text-lg">Practice Questions for ${material.title}</h3>
                <div class="space-y-4 mt-4">
        `

    questions.forEach((question, index) => {
      questionsHTML += `
                <div class="bg-gray-900 p-4 rounded-lg">
                    <p class="text-white font-medium mb-2">Question ${index + 1}: ${question.text}</p>
                    ${
                      question.type === "multiple_choice"
                        ? `
                        <div class="space-y-2 mt-3">
                            ${question.options
                              .map(
                                (option, i) => `
                                <div class="flex items-center">
                                    <input type="radio" id="q${index}_option${i}" name="question${index}" class="mr-2">
                                    <label for="q${index}_option${i}" class="text-gray-300">${option}</label>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    `
                        : `
                        <textarea class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mt-2" rows="3" placeholder="Enter your answer here..."></textarea>
                    `
                    }
                </div>
            `
    })

    questionsHTML += `
                </div>
            </div>
        `

    const questionsModal = createModal("Practice Questions", questionsHTML)
    document.body.appendChild(questionsModal)
  })
}

function showSubmitAssignmentModal(assignmentId) {
  const assignment = window.EduAI.assignments.find((a) => a.id === assignmentId)
  if (!assignment) return

  const course = window.EduAI.courses.find((c) => c.id === assignment.courseId)
  const courseName = course ? course.name : "Unknown Course"

  let submitHTML = `
        <div class="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 class="font-semibold text-white text-lg">${assignment.title}</h3>
            <p class="text-gray-400">${courseName}</p>
            <p class="text-gray-400 text-sm mt-2">${assignment.description}</p>
        </div>
        <form id="assignment-submission-form">
            <div class="space-y-4">
    `

  assignment.questions.forEach((question, index) => {
    submitHTML += `
            <div class="bg-gray-900 p-4 rounded-lg">
                <p class="text-white font-medium mb-2">Question ${index + 1}: ${question.text}</p>
                <textarea class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white mt-2" rows="3" name="answer_${question.id}" placeholder="Enter your answer here..." required></textarea>
            </div>
        `
  })

  submitHTML += `
            </div>
            <button type="submit" class="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                Submit Assignment
            </button>
        </form>
    `

  const modal = createModal("Submit Assignment", submitHTML)
  document.body.appendChild(modal)

  // Add event listener
  document.getElementById("assignment-submission-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const currentUser = window.EduAI.getCurrentUser()

    // Collect answers
    const answers = []

    assignment.questions.forEach((question) => {
      const answerElement = document.querySelector(`[name="answer_${question.id}"]`)
      if (answerElement) {
        answers.push({
          questionId: question.id,
          answer: answerElement.value,
        })
      }
    })

    // Create submission
    const submission = {
      id: Date.now(),
      assignmentId: assignment.id,
      studentId: currentUser.id,
      submissionDate: new Date().toISOString(),
      status: "pending",
      answers: answers,
    }

    // Add to submissions
    window.EduAI.submissions.push(submission)
    window.EduAI.saveData()

    // Show success message
    window.showNotification("Assignment submitted successfully!", "success")

    // Close modal
    document.body.removeChild(modal)

    // Refresh dashboard
    loadStudentDashboard(currentUser.id)
  })
}

function showSubmissionModal(submissionId) {
  const submission = window.EduAI.submissions.find((s) => s.id === submissionId)
  if (!submission) return

  const assignment = window.EduAI.assignments.find((a) => a.id === submission.assignmentId)
  if (!assignment) return

  const course = window.EduAI.courses.find((c) => c.id === assignment.courseId)
  const courseName = course ? course.name : "Unknown Course"

  let submissionHTML = `
        <div class="bg-gray-800 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-white text-lg">${assignment.title}</h3>
                    <p class="text-gray-400">${courseName}</p>
                </div>
                <span class="text-xs ${submission.status === "graded" ? "bg-green-900 text-green-200" : "bg-yellow-900 text-yellow-200"} px-2 py-1 rounded-full">
                    ${submission.status === "graded" ? `Graded: ${submission.evaluation.score}%` : "Pending Review"}
                </span>
            </div>
        </div>
        <div class="space-y-4">
    `

  // Match questions with answers
  assignment.questions.forEach((question, index) => {
    const answer = submission.answers.find((a) => a.questionId === question.id)

    submissionHTML += `
            <div class="bg-gray-900 p-4 rounded-lg">
                <p class="text-white font-medium mb-2">Question ${index + 1}: ${question.text}</p>
                <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-300">
                    ${answer ? answer.answer : "No answer provided"}
                </div>
            </div>
        `
  })

  submissionHTML += `
        </div>
    `

  // Add evaluation if graded
  if (submission.status === "graded" && submission.evaluation) {
    submissionHTML += `
            <div class="mt-6 bg-gray-800 rounded-lg p-4">
                <h3 class="font-semibold text-white text-lg mb-2">Feedback</h3>
                <p class="text-gray-300 mb-3">${submission.evaluation.feedback}</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-green-400 font-medium mb-2">Strengths</h4>
                        <ul class="space-y-1">
                            ${submission.evaluation.strengths
                              .map(
                                (strength) => `
                                <li class="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span class="text-gray-300">${strength}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-yellow-400 font-medium mb-2">Areas for Improvement</h4>
                        <ul class="space-y-1">
                            ${submission.evaluation.weaknesses
                              .map(
                                (weakness) => `
                                <li class="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span class="text-gray-300">${weakness}</span>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                </div>
            </div>
        `
  } else {
    // Add button to request AI evaluation
    submissionHTML += `
            <button id="request-ai-evaluation" class="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                Request AI Evaluation
            </button>
        `
  }

  const modal = createModal("Submission Details", submissionHTML)
  document.body.appendChild(modal)

  // Add event listener for AI evaluation
  const evaluateBtn = document.getElementById("request-ai-evaluation")
  if (evaluateBtn) {
    evaluateBtn.addEventListener("click", function () {
      // Show loading state
      this.disabled = true
      this.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Processing...</span>
                </div>
            `

      // Simulate AI processing delay
      setTimeout(() => {
        const evaluation = window.EduAI.evaluateSubmission(submissionId)

        if (evaluation) {
          // Close current modal and show updated submission
          document.body.removeChild(modal)
          showSubmissionModal(submissionId)

          // Show success message
          window.showNotification("Assignment evaluated successfully!", "success")
        }
      }, 2000)
    })
  }
}

// Helper function to create a modal
function createModal(title, content) {
  const modal = document.createElement("div")
  modal.className = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"

  modal.innerHTML = `
        <div class="bg-gray-900 rounded-xl p-6 max-w-3xl w-full mx-4 border border-gray-700 shadow-2xl animate__animated animate__fadeInDown max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-blue-400">${title}</h2>
                <button class="close-modal text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `

  // Add event listener to close button
  modal.querySelector(".close-modal").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  // Close when clicking outside
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal)
    }
  })

  return modal
}

// Helper function to show notifications
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600"
  } text-white`
  notification.textContent = message

  // Add to document
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add("opacity-0", "transition-opacity", "duration-500")
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 500)
  }, 3000)
}

// Expose functions globally
window.showNotification = showNotification

// Dummy functions to resolve undeclared variable errors
function showCourseMaterialsModal(courseId) {
  console.log(`Showing materials for course ID: ${courseId}`)
  // Add your implementation here
}

function showCourseAssignmentsModal(courseId) {
  console.log(`Showing assignments for course ID: ${courseId}`)
  // Add your implementation here
}

