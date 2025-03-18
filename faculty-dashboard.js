import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!window.EduAI || !window.EduAI.isLoggedIn()) {
    window.location.href = "index.html"
    return
  }

  const currentUser = window.EduAI.getCurrentUser()

  // Verify user is a faculty
  if (currentUser.role !== "faculty") {
    window.location.href = `${currentUser.role}-dashboard.html`
    return
  }

  // Update user info in the UI
  updateUserInfo(currentUser)

  // Load faculty data
  loadFacultyDashboard(currentUser.id)

  // Set up event listeners
  setupEventListeners()

  // Initialize class performance chart
  initializeClassPerformanceChart()

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

function loadFacultyDashboard(facultyId) {
  // Get faculty's courses
  const courses = window.EduAI.getCoursesByUser(facultyId, "faculty")

  // Get all submissions for faculty's courses
  const allSubmissions = []
  courses.forEach((course) => {
    const courseAssignments = window.EduAI.getAssignmentsByCourse(course.id)
    courseAssignments.forEach((assignment) => {
      const assignmentSubmissions = window.EduAI.getSubmissionsByAssignment(assignment.id)
      allSubmissions.push(
        ...assignmentSubmissions.map((submission) => ({
          ...submission,
          assignment,
          course,
        })),
      )
    })
  })

  // Get all materials for faculty's courses
  const allMaterials = []
  courses.forEach((course) => {
    const courseMaterials = window.EduAI.getMaterialsByCourse(course.id)
    allMaterials.push(
      ...courseMaterials.map((material) => ({
        ...material,
        course,
      })),
    )
  })

  // Update UI with data
  updateCoursesSection(courses)
  updateSubmissionsSection(allSubmissions)
  updateMaterialsSection(allMaterials)
}

function updateCoursesSection(courses) {
  const coursesContainer = document.querySelector("#courses-container")
  if (!coursesContainer) return

  let coursesHTML = ""

  courses.forEach((course) => {
    // Get student count
    const studentCount = course.students ? course.students.length : 0

    coursesHTML += `
            <div class="bg-gray-900 rounded-lg p-4 border-l-4 border-purple-500">
                <div class="flex justify-between items-center">
                    <h3 class="font-semibold text-white">${course.name}</h3>
                    <span class="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded-full">${studentCount} Students</span>
                </div>
                <p class="text-gray-400 text-sm mt-1">Spring 2025 - ${course.code}</p>
                <div class="mt-3 flex justify-between">
                    <button class="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded transition duration-300 view-course" data-id="${course.id}">
                        View Course
                    </button>
                    <button class="text-xs bg-purple-800 hover:bg-purple-700 text-white px-2 py-1 rounded transition duration-300 manage-students" data-id="${course.id}">
                        Manage Students
                    </button>
                </div>
            </div>
        `
  })

  coursesContainer.innerHTML = coursesHTML

  // Add event listeners
  document.querySelectorAll(".view-course").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-id"))
      showCourseModal(courseId)
    })
  })

  document.querySelectorAll(".manage-students").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-id"))
      showManageStudentsModal(courseId)
    })
  })

  // Add event listener for create course button
  const createCourseBtn = document.querySelector("#create-course-btn")
  if (createCourseBtn) {
    createCourseBtn.addEventListener("click", () => {
      showCreateCourseModal()
    })
  }
}

function updateSubmissionsSection(submissions) {
  const submissionsContainer = document.querySelector("#submissions-container")
  if (!submissionsContainer) return

  // Sort submissions by date (newest first)
  submissions.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))

  // Take only the first 4
  const recentSubmissions = submissions.slice(0, 4)

  let submissionsHTML = ""

  recentSubmissions.forEach((submission) => {
    // Get student name
    const student = window.EduAI.users.students.find((s) => s.id === submission.studentId)
    const studentName = student ? student.name : "Unknown Student"

    // Calculate time since submission
    const submissionDate = new Date(submission.submissionDate)
    const now = new Date()
    const hoursSince = Math.floor((now - submissionDate) / (1000 * 60 * 60))

    let timeText = ""
    if (hoursSince < 1) {
      timeText = "Submitted just now"
    } else if (hoursSince === 1) {
      timeText = "Submitted 1 hour ago"
    } else if (hoursSince < 24) {
      timeText = `Submitted ${hoursSince} hours ago`
    } else {
      const daysSince = Math.floor(hoursSince / 24)
      timeText = daysSince === 1 ? "Submitted yesterday" : `Submitted ${daysSince} days ago`
    }

    if (submission.status === "graded") {
      timeText = `Graded ${timeText.substring(10)}`
    }

    submissionsHTML += `
            <div class="bg-gray-900 rounded-lg p-4">
                <div class="flex justify-between">
                    <div>
                        <h3 class="font-semibold text-white">${submission.assignment.title}</h3>
                        <p class="text-gray-400 text-sm">${studentName}</p>
                    </div>
                    <span class="text-xs ${
                      submission.status === "graded"
                        ? submission.evaluation.score >= 80
                          ? "bg-green-600 text-green-100"
                          : submission.evaluation.score >= 70
                            ? "bg-yellow-600 text-yellow-100"
                            : "bg-red-600 text-red-100"
                        : "bg-yellow-600 text-yellow-100"
                    } px-2 py-1 h-fit rounded-full">
                        ${submission.status === "graded" ? `Graded: ${submission.evaluation.score}%` : "Pending Review"}
                    </span>
                </div>
                <div class="mt-3 flex justify-between items-center">
                    <span class="text-xs text-gray-500">${timeText}</span>
                    <button class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition duration-300 review-submission" data-id="${submission.id}">
                        ${submission.status === "graded" ? "View Details" : "Review"}
                    </button>
                </div>
            </div>
        `
  })

  submissionsContainer.innerHTML = submissionsHTML

  // Add event listeners
  document.querySelectorAll(".review-submission").forEach((btn) => {
    btn.addEventListener("click", function () {
      const submissionId = Number.parseInt(this.getAttribute("data-id"))
      showReviewSubmissionModal(submissionId)
    })
  })

  // Add event listener for view all submissions button
  const viewAllSubmissionsBtn = document.querySelector("#view-all-submissions-btn")
  if (viewAllSubmissionsBtn) {
    viewAllSubmissionsBtn.addEventListener("click", () => {
      showAllSubmissionsModal(submissions)
    })
  }
}

function updateMaterialsSection(materials) {
  const materialsContainer = document.querySelector("#materials-container")
  if (!materialsContainer) return

  // Sort materials by date (newest first)
  materials.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))

  // Take only the first 3
  const recentMaterials = materials.slice(0, 3)

  let materialsHTML = ""

  recentMaterials.forEach((material) => {
    // Calculate days since added
    const addedDate = new Date(material.dateAdded)
    const now = new Date()
    const daysSince = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24))

    let timeText = ""
    if (daysSince === 0) {
      timeText = "Today"
    } else if (daysSince === 1) {
      timeText = "Yesterday"
    } else if (daysSince < 7) {
      timeText = `${daysSince} days ago`
    } else if (daysSince < 30) {
      const weeksSince = Math.floor(daysSince / 7)
      timeText = weeksSince === 1 ? "1 week ago" : `${weeksSince} weeks ago`
    } else {
      timeText = "Over a month ago"
    }

    // Determine icon based on material type
    let icon = ""
    if (material.type === "pdf") {
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>`
    } else if (material.type === "video") {
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>`
    } else if (material.type === "interactive") {
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>`
    }

    // Determine background color based on material type
    let bgColor = ""
    if (material.type === "pdf") {
      bgColor = "bg-purple-900"
    } else if (material.type === "video") {
      bgColor = "bg-blue-900"
    } else if (material.type === "interactive") {
      bgColor = "bg-green-900"
    }

    materialsHTML += `
            <div class="bg-gray-900 rounded-lg p-4 flex items-center">
                <div class="${bgColor} p-3 rounded-lg mr-4">
                    ${icon}
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-white">${material.title}</h3>
                    <p class="text-gray-400 text-sm">Last updated ${timeText}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="text-purple-400 hover:text-purple-300 edit-material" data-id="${material.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button class="text-purple-400 hover:text-purple-300 view-material" data-id="${material.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
            </div>
        `
  })

  materialsContainer.innerHTML = materialsHTML

  // Add event listeners
  document.querySelectorAll(".edit-material").forEach((btn) => {
    btn.addEventListener("click", function () {
      const materialId = Number.parseInt(this.getAttribute("data-id"))
      showEditMaterialModal(materialId)
    })
  })

  document.querySelectorAll(".view-material").forEach((btn) => {
    btn.addEventListener("click", function () {
      const materialId = Number.parseInt(this.getAttribute("data-id"))
      showViewMaterialModal(materialId)
    })
  })

  // Add event listeners for upload and create material buttons
  const uploadMaterialBtn = document.querySelector("#upload-material-btn")
  if (uploadMaterialBtn) {
    uploadMaterialBtn.addEventListener("click", () => {
      showUploadMaterialModal()
    })
  }

  const createMaterialBtn = document.querySelector("#create-material-btn")
  if (createMaterialBtn) {
    createMaterialBtn.addEventListener("click", () => {
      showCreateMaterialModal()
    })
  }
}

function initializeClassPerformanceChart() {
  const ctx = document.getElementById("classPerformanceChart")
  if (!ctx) return

  const currentUser = window.EduAI.getCurrentUser()
  const courses = window.EduAI.getCoursesByUser(currentUser.id, "faculty")

  // Prepare data for chart
  const labels = ["90-100%", "80-89%", "70-79%", "60-69%", "Below 60%"]
  const datasets = []

  // Generate random data for each course
  courses.forEach((course, index) => {
    const colors = [
      { bg: "rgba(139, 92, 246, 0.7)", border: "rgb(139, 92, 246)" },
      { bg: "rgba(59, 130, 246, 0.7)", border: "rgb(59, 130, 246)" },
      { bg: "rgba(16, 185, 129, 0.7)", border: "rgb(16, 185, 129)" },
    ]

    // Generate random distribution of grades
    const data = [
      Math.floor(Math.random() * 10) + 5, // 90-100%
      Math.floor(Math.random() * 10) + 10, // 80-89%
      Math.floor(Math.random() * 10) + 5, // 70-79%
      Math.floor(Math.random() * 5) + 1, // 60-69%
      Math.floor(Math.random() * 3) + 1, // Below 60%
    ]

    datasets.push({
      label: course.name,
      data: data,
      backgroundColor: colors[index % colors.length].bg,
      borderColor: colors[index % colors.length].border,
      borderWidth: 1,
    })
  })

  const classPerformanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
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
  // AI Teaching Tools buttons
  const createQuizBtn = document.querySelector("#create-quiz-btn")
  if (createQuizBtn) {
    createQuizBtn.addEventListener("click", () => {
      showCreateQuizModal()
    })
  }

  const createProblemSetBtn = document.querySelector("#create-problem-set-btn")
  if (createProblemSetBtn) {
    createProblemSetBtn.addEventListener("click", () => {
      showCreateProblemSetModal()
    })
  }

  const simplifyMaterialBtn = document.querySelector("#simplify-material-btn")
  if (simplifyMaterialBtn) {
    simplifyMaterialBtn.addEventListener("click", () => {
      showSimplifyMaterialModal()
    })
  }

  const autoGradeBtn = document.querySelector("#auto-grade-btn")
  if (autoGradeBtn) {
    autoGradeBtn.addEventListener("click", () => {
      showAutoGradeModal()
    })
  }

  const viewInsightsBtn = document.querySelector("#view-insights-btn")
  if (viewInsightsBtn) {
    viewInsightsBtn.addEventListener("click", () => {
      showInsightsModal()
    })
  }

  // Add Student buttons
  const addByEmailBtn = document.querySelector("#add-by-email-btn")
  if (addByEmailBtn) {
    addByEmailBtn.addEventListener("click", () => {
      showAddByEmailModal()
    })
  }

  const uploadCSVBtn = document.querySelector("#upload-csv-btn")
  if (uploadCSVBtn) {
    uploadCSVBtn.addEventListener("click", () => {
      showUploadCSVModal()
    })
  }

  const manageEnrollmentsBtn = document.querySelector("#manage-enrollments-btn")
  if (manageEnrollmentsBtn) {
    manageEnrollmentsBtn.addEventListener("click", () => {
      showManageEnrollmentsModal()
    })
  }

  // View Analytics button
  const viewAnalyticsBtn = document.querySelector("#view-analytics-btn")
  if (viewAnalyticsBtn) {
    viewAnalyticsBtn.addEventListener("click", () => {
      showAnalyticsModal()
    })
  }
}

// Modal functions
function showCourseModal(courseId) {
  const course = window.EduAI.courses.find((c) => c.id === courseId)
  if (!course) return

  // Get course materials
  const materials = window.EduAI.getMaterialsByCourse(courseId)

  // Get course assignments
  const assignments = window.EduAI.getAssignmentsByCourse(courseId)

  // Get course students
  const students = []
  if (course.students) {
    course.students.forEach((studentId) => {
      const student = window.EduAI.users.students.find((s) => s.id === studentId)
      if (student) {
        students.push(student)
      }
    })
  }

  let courseHTML = `
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 class="font-semibold text-white text-xl">${course.name}</h3>
            <p class="text-gray-400">${course.code}</p>
            <p class="text-gray-400 mt-2">${course.description || "No description available."}</p>
            <div class="mt-4 flex space-x-2">
                <span class="bg-purple-900 text-purple-200 px-2 py-1 rounded-full text-xs">${students.length} Students</span>
                <span class="bg-blue-900 text-blue-200 px-2 py-1 rounded-full text-xs">${materials.length} Materials</span>
                <span class="bg-green-900 text-green-200 px-2 py-1 rounded-full text-xs">${assignments.length} Assignments</span>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Materials Section -->
            <div>
                <h3 class="font-semibold text-white text-lg mb-3">Course Materials</h3>
                <div class="space-y-3 max-h-60 overflow-y-auto">
    `

  if (materials.length === 0) {
    courseHTML += `
            <p class="text-gray-400">No materials available for this course.</p>
        `
  } else {
    materials.forEach((material) => {
      // Determine icon based on material type
      let icon = ""
      if (material.type === "pdf") {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>`
      } else if (material.type === "video") {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>`
      } else if (material.type === "interactive") {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>`
      }

      courseHTML += `
                <div class="bg-gray-900 rounded-lg p-3 flex items-center">
                    <div class="mr-3">
                        ${icon}
                    </div>
                    <div class="flex-1">
                        <h4 class="text-white font-medium">${material.title}</h4>
                        <p class="text-gray-400 text-xs">${new Date(material.dateAdded).toLocaleDateString()}</p>
                    </div>
                    <button class="text-purple-400 hover:text-purple-300 view-material-btn" data-id="${material.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
            `
    })
  }

  courseHTML += `
                </div>
                <div class="mt-3">
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition duration-300 add-material-btn" data-course-id="${courseId}">
                        Add Material
                    </button>
                </div>
            </div>
            
            <!-- Assignments Section -->
            <div>
                <h3 class="font-semibold text-white text-lg mb-3">Assignments</h3>
                <div class="space-y-3 max-h-60 overflow-y-auto">
    `

  if (assignments.length === 0) {
    courseHTML += `
            <p class="text-gray-400">No assignments available for this course.</p>
        `
  } else {
    assignments.forEach((assignment) => {
      // Calculate days until due
      const dueDate = new Date(assignment.dueDate)
      const today = new Date()
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

      let dueDateClass = "text-green-400"
      let dueDateText = `Due in ${daysUntilDue} days`

      if (daysUntilDue <= 0) {
        dueDateClass = "text-red-400"
        dueDateText = "Past due"
      } else if (daysUntilDue <= 3) {
        dueDateClass = "text-yellow-400"
      }

      courseHTML += `
                <div class="bg-gray-900 rounded-lg p-3">
                    <div class="flex justify-between items-start">
                        <h4 class="text-white font-medium">${assignment.title}</h4>
                        <span class="text-xs ${dueDateClass}">${dueDateText}</span>
                    </div>
                    <p class="text-gray-400 text-xs mt-1">${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}</p>
                    <div class="mt-2 flex justify-between items-center">
                        <span class="text-gray-500 text-xs">${assignment.questions.length} questions</span>
                        <button class="text-purple-400 hover:text-purple-300 view-assignment-btn" data-id="${assignment.id}">
                            View Details
                        </button>
                    </div>
                </div>
            `
    })
  }

  courseHTML += `
                </div>
                <div class="mt-3">
                    <button class="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition duration-300 create-assignment-btn" data-course-id="${courseId}">
                        Create Assignment
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Students Section -->
        <div class="mt-6">
            <h3 class="font-semibold text-white text-lg mb-3">Enrolled Students</h3>
            <div class="bg-gray-800 rounded-lg p-4">
                <div class="max-h-40 overflow-y-auto">
    `

  if (students.length === 0) {
    courseHTML += `
            <p class="text-gray-400">No students enrolled in this course.</p>
        `
  } else {
    courseHTML += `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        `

    students.forEach((student) => {
      courseHTML += `
                <div class="bg-gray-900 rounded-lg p-3 flex items-center">
                    <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                        <span class="text-white font-medium">${student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-white font-medium">${student.name}</h4>
                        <p class="text-gray-400 text-xs">${student.email}</p>
                    </div>
                    <button class="text-red-400 hover:text-red-300 remove-student-btn" data-student-id="${student.id}" data-course-id="${courseId}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            `
    })

    courseHTML += `
            </div>
        `
  }

  courseHTML += `
                </div>
                <div class="mt-3">
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition duration-300 add-student-btn" data-course-id="${courseId}">
                        Add Student
                    </button>
                </div>
            </div>
        </div>
    `

  const modal = createModal(course.name, courseHTML, "lg")
  document.body.appendChild(modal)

  // Add event listeners
  document.querySelectorAll(".view-material-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const materialId = Number.parseInt(this.getAttribute("data-id"))
      document.body.removeChild(modal)
      showViewMaterialModal(materialId)
    })
  })

  document.querySelectorAll(".view-assignment-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const assignmentId = Number.parseInt(this.getAttribute("data-id"))
      document.body.removeChild(modal)
      showViewAssignmentModal(assignmentId)
    })
  })

  document.querySelectorAll(".add-material-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-course-id"))
      document.body.removeChild(modal)
      showAddMaterialModal(courseId)
    })
  })

  document.querySelectorAll(".create-assignment-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-course-id"))
      document.body.removeChild(modal)
      showCreateAssignmentModal(courseId)
    })
  })

  document.querySelectorAll(".add-student-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const courseId = Number.parseInt(this.getAttribute("data-course-id"))
      document.body.removeChild(modal)
      showAddStudentModal(courseId)
    })
  })

  document.querySelectorAll(".remove-student-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const studentId = Number.parseInt(this.getAttribute("data-student-id"))
      const courseId = Number.parseInt(this.getAttribute("data-course-id"))

      if (confirm("Are you sure you want to remove this student from the course?")) {
        // Remove student from course
        const course = window.EduAI.courses.find((c) => c.id === courseId)
        if (course && course.students) {
          course.students = course.students.filter((id) => id !== studentId)

          // Remove course from student
          const student = window.EduAI.users.students.find((s) => s.id === studentId)
          if (student && student.courses) {
            student.courses = student.courses.filter((id) => id !== courseId)
          }

          window.EduAI.saveData()

          // Refresh modal
          document.body.removeChild(modal)
          showCourseModal(courseId)

          window.showNotification("Student removed from course", "success")
        }
      }
    })
  })
}

function showManageStudentsModal(courseId) {
  const course = window.EduAI.courses.find((c) => c.id === courseId)
  if (!course) return

  // Get all students
  const allStudents = window.EduAI.users.students

  // Get enrolled students
  const enrolledStudentIds = course.students || []

  let studentsHTML = `
        <div class="mb-4">
            <input type="text" id="student-search" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Search students...">
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
    `

  allStudents.forEach((student) => {
    const isEnrolled = enrolledStudentIds.includes(student.id)

    studentsHTML += `
            <div class="bg-gray-800 rounded-lg p-3 flex items-center student-item">
                <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                    <span class="text-white font-medium">${student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}</span>
                </div>
                <div class="flex-1">
                    <h4 class="text-white font-medium student-name">${student.name}</h4>
                    <p class="text-gray-400 text-xs">${student.email}</p>
                </div>
                <div>
                    <button class="text-xs ${isEnrolled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white px-2 py-1 rounded transition duration-300 toggle-enrollment" data-student-id="${student.id}" data-enrolled="${isEnrolled}">
                        ${isEnrolled ? "Remove" : "Add"}
                    </button>
                </div>
            </div>
        `
  })

  studentsHTML += `
        </div>
    `

  const modal = createModal(`Manage Students - ${course.name}`, studentsHTML, "lg")
  document.body.appendChild(modal)

  // Add event listeners
  document.querySelectorAll(".toggle-enrollment").forEach((btn) => {
    btn.addEventListener("click", function () {
      const studentId = Number.parseInt(this.getAttribute("data-student-id"))
      const isEnrolled = this.getAttribute("data-enrolled") === "true"

      if (isEnrolled) {
        // Remove student from course
        course.students = course.students.filter((id) => id !== studentId)

        // Remove course from student
        const student = window.EduAI.users.students.find((s) => s.id === studentId)
        if (student && student.courses) {
          student.courses = student.courses.filter((id) => id !== courseId)
        }

        // Update button
        this.textContent = "Add"
        this.classList.remove("bg-red-600", "hover:bg-red-700")
        this.classList.add("bg-green-600", "hover:bg-green-700")
        this.setAttribute("data-enrolled", "false")

        window.showNotification("Student removed from course", "success")
      } else {
        // Add student to course
        if (!course.students) {
          course.students = []
        }
        course.students.push(studentId)

        // Add course to student
        const student = window.EduAI.users.students.find((s) => s.id === studentId)
        if (student) {
          if (!student.courses) {
            student.courses = []
          }
          student.courses.push(courseId)
        }

        // Update button
        this.textContent = "Remove"
        this.classList.remove("bg-green-600", "hover:bg-green-700")
        this.classList.add("bg-red-600", "hover:bg-red-700")
        this.setAttribute("data-enrolled", "true")

        window.showNotification("Student added to course", "success")
      }

      window.EduAI.saveData()
    })
  })

  // Add search functionality
  const searchInput = document.getElementById("student-search")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()

      document.querySelectorAll(".student-item").forEach((item) => {
        const studentName = item.querySelector(".student-name").textContent.toLowerCase()

        if (studentName.includes(searchTerm)) {
          item.style.display = "flex"
        } else {
          item.style.display = "none"
        }
      })
    })
  }
}

function showCreateCourseModal() {
  const createCourseHTML = `
        <form id="create-course-form">
            <div class="space-y-4">
                <div>
                    <label for="course-name" class="block text-gray-300 mb-2">Course Name</label>
                    <input type="text" id="course-name" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="e.g., Advanced Mathematics" required>
                </div>
                <div>
                    <label for="course-code" class="block text-gray-300 mb-2">Course Code</label>
                    <input type="text" id="course-code" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="e.g., MATH401" required>
                </div>
                <div>
                    <label for="course-description" class="block text-gray-300 mb-2">Description</label>
                    <textarea id="course-description" rows="4" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Enter course description..."></textarea>
                </div>
            </div>
            <button type="submit" class="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                Create Course
            </button>
        </form>
    `

  const modal = createModal("Create New Course", createCourseHTML)
  document.body.appendChild(modal)

  // Add event listener
  document.getElementById("create-course-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const currentUser = window.EduAI.getCurrentUser()

    // Get form values
    const name = document.getElementById("course-name").value
    const code = document.getElementById("course-code").value
    const description = document.getElementById("course-description").value

    // Create new course
    const newCourse = {
      id: Date.now(),
      name,
      code,
      description,
      faculty: currentUser.id,
      students: [],
      materials: [],
      assignments: [],
    }

    // Add to courses
    window.EduAI.courses.push(newCourse)

    // Add to faculty's courses
    const faculty = window.EduAI.users.faculty.find((f) => f.id === currentUser.id)
    if (faculty) {
      if (!faculty.courses) {
        faculty.courses = []
      }
      faculty.courses.push(newCourse.id)
    }

    window.EduAI.saveData()

    // Show success message
    window.showNotification("Course created successfully!", "success")

    // Close modal
    document.body.removeChild(modal)

    // Refresh dashboard
    loadFacultyDashboard(currentUser.id)
  })
}

function showReviewSubmissionModal(submissionId) {
  const submission = window.EduAI.submissions.find((s) => s.id === submissionId)
  if (!submission) return

  const assignment = window.EduAI.assignments.find((a) => a.id === submission.assignmentId)
  if (!assignment) return

  const course = window.EduAI.courses.find((c) => c.id === assignment.courseId)
  const courseName = course ? course.name : "Unknown Course"

  const student = window.EduAI.users.students.find((s) => s.id === submission.studentId)
  const studentName = student ? student.name : "Unknown Student"

  let reviewHTML = `
        <div class="bg-gray-800 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-white text-lg">${assignment.title}</h3>
                    <p class="text-gray-400">${courseName}</p>
                    <p class="text-gray-400 text-sm mt-1">Submitted by: ${studentName}</p>
                </div>
                <span class="text-xs ${submission.status === "graded" ? "bg-green-900 text-green-200" : "bg-yellow-900 text-yellow-200"} px-2 py-1 rounded-full">
                    ${submission.status === "graded" ? `Graded: ${submission.evaluation.score}%` : "Pending Review"}
                </span>
            </div>
        </div>
        <div class="space-y-4 max-h-80 overflow-y-auto">
    `

  // Match questions with answers
  assignment.questions.forEach((question, index) => {
    const answer = submission.answers.find((a) => a.questionId === question.id)

    reviewHTML += `
            <div class="bg-gray-900 p-4 rounded-lg">
                <p class="text-white font-medium mb-2">Question ${index + 1}: ${question.text}</p>
                <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-300 mb-3">
                    ${answer ? answer.answer : "No answer provided"}
                </div>
                ${
                  submission.status === "graded"
                    ? ""
                    : `
                    <div>
                        <label class="block text-gray-300 mb-1 text-sm">Feedback for this answer:</label>
                        <textarea class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm" rows="2" id="feedback-${question.id}" placeholder="Enter feedback..."></textarea>
                    </div>
                `
                }
            </div>
        `
  })

  reviewHTML += `
        </div>
    `

  if (submission.status === "graded") {
    // Show evaluation
    reviewHTML += `
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
    // Show grading form
    reviewHTML += `
            <div class="mt-6">
                <form id="grade-submission-form">
                    <div class="space-y-4">
                        <div>
                            <label for="submission-score" class="block text-gray-300 mb-2">Score (0-100)</label>
                            <input type="number" id="submission-score" min="0" max="100" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Enter score..." required>
                        </div>
                        <div>
                            <label for="submission-feedback" class="block text-gray-300 mb-2">Overall Feedback</label>
                            <textarea id="submission-feedback" rows="4" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Enter overall feedback..." required></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="submission-strengths" class="block text-gray-300 mb-2">Strengths (one per line)</label>
                                <textarea id="submission-strengths" rows="3" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Enter strengths..." required></textarea>
                            </div>
                            <div>
                                <label for="submission-weaknesses" class="block text-gray-300 mb-2">Areas for Improvement (one per line)</label>
                                <textarea id="submission-weaknesses" rows="3" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Enter areas for improvement..." required></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 flex space-x-3">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                            Submit Evaluation
                        </button>
                        <button type="button" id="ai-evaluate-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                            AI Evaluate
                        </button>
                    </div>
                </form>
            </div>
        `
  }

  const modal = createModal("Review Submission", reviewHTML, "lg")
  document.body.appendChild(modal)

  // Add event listeners
  if (submission.status !== "graded") {
    document.getElementById("grade-submission-form").addEventListener("submit", (e) => {
      e.preventDefault()

      // Get form values
      const score = Number.parseInt(document.getElementById("submission-score").value)
      const feedback = document.getElementById("submission-feedback").value
      const strengths = document
        .getElementById("submission-strengths")
        .value.split("\n")
        .filter((s) => s.trim() !== "")
      const weaknesses = document
        .getElementById("submission-weaknesses")
        .value.split("\n")
        .filter((w) => w.trim() !== "")

      // Create evaluation
      const evaluation = {
        submissionId,
        score,
        feedback,
        strengths,
        weaknesses,
        gradedDate: new Date().toISOString(),
      }

      // Update submission
      submission.status = "graded"
      submission.evaluation = evaluation

      window.EduAI.saveData()

      // Show success message
      window.showNotification("Submission graded successfully!", "success")

      // Close modal
      document.body.removeChild(modal)

      // Refresh dashboard
      const currentUser = window.EduAI.getCurrentUser()
      loadFacultyDashboard(currentUser.id)
    })

    document.getElementById("ai-evaluate-btn").addEventListener("click", function () {
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
          showReviewSubmissionModal(submissionId)

          // Show success message
          window.showNotification("Submission evaluated by AI successfully!", "success")

          // Refresh dashboard
          const currentUser = window.EduAI.getCurrentUser()
          loadFacultyDashboard(currentUser.id)
        }
      }, 2000)
    })
  }
}

function showAllSubmissionsModal(submissions) {
    // Group submissions by course
    const courseSubmissions = {};
    
    submissions.forEach(submission => {
        const courseId = submission.course.id;
        
        if (!courseSubmissions[courseId]) {
            courseSubmissions[courseId] = {
                course: submission.course,
                submissions: []
            };
        }
        
        courseSubmissions[courseId].submissions.push(submission);
    });
    
    let submissionsHTML = `
        <div class="mb-4">
            <input type="text" id="submission-search" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Search submissions...">
        </div>
        <div class="space-y-6 max-h-80 overflow-y-auto">
    `;
    
    Object.values(courseSubmissions).forEach(courseData => {
        submissionsHTML += `
            <div class="submission-course">
                <h3 class="font-semibold text-white text-lg mb-3">${courseData.course.name}</h3>
                <div class="space-y-3">
        `;
        
        courseData.submissions.forEach(submission => {
            // Get student name
            const student = window.EduAI.users.students.find(s => s.id === submission.studentId);
            const studentName = student ? student.name : 'Unknown Student';
            
            // Calculate time since submission
            const submissionDate = new Date(submission.submissionDate);
            const now = new Date();
            const hoursSince = Math.floor((now - submissionDate) / (1000 * 60 * 60));
            
            let timeText = '';
            if (hoursSince < 1) {
                timeText = 'Submitted just now';
            } else if (hoursSince === 1) {
                timeText = 'Submitted 1 hour ago';
            } else if (hoursSince < 24) {
                timeText = `Submitted ${hoursSince} hours ago`;
            }

