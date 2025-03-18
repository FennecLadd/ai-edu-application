document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  if (window.EduAPI && window.EduAPI.isLoggedIn()) {
    const currentUser = window.EduAPI.getCurrentUser()
    redirectToDashboard(currentUser.role)
  }

  // Login Modal Functionality
  const loginBtn = document.getElementById("loginBtn")
  const loginModal = document.getElementById("loginModal")
  const closeLoginBtn = document.getElementById("closeLoginBtn")
  const loginForm = document.getElementById("loginForm")

  // Role selection buttons
  const studentLoginBtn = document.getElementById("studentLoginBtn")
  const facultyLoginBtn = document.getElementById("facultyLoginBtn")
  const adminLoginBtn = document.getElementById("adminLoginBtn")

  // Current selected role
  let currentRole = "student"

  // Open login modal
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      loginModal.classList.remove("hidden")
    })
  }

  // Close login modal
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener("click", () => {
      loginModal.classList.add("hidden")
    })
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.classList.add("hidden")
    }
  })

  // Role selection
  if (studentLoginBtn) {
    studentLoginBtn.addEventListener("click", () => {
      setActiveRole("student")
    })
  }

  if (facultyLoginBtn) {
    facultyLoginBtn.addEventListener("click", () => {
      setActiveRole("faculty")
    })
  }

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
      setActiveRole("admin")
    })
  }

  function setActiveRole(role) {
    currentRole = role

    // Reset all buttons
    studentLoginBtn.classList.remove("bg-blue-600", "hover:bg-blue-700")
    studentLoginBtn.classList.add("bg-gray-700", "hover:bg-gray-600")

    facultyLoginBtn.classList.remove("bg-purple-600", "hover:bg-purple-700")
    facultyLoginBtn.classList.add("bg-gray-700", "hover:bg-gray-600")

    adminLoginBtn.classList.remove("bg-green-600", "hover:bg-green-700")
    adminLoginBtn.classList.add("bg-gray-700", "hover:bg-gray-600")

    // Set active button
    if (role === "student") {
      studentLoginBtn.classList.remove("bg-gray-700", "hover:bg-gray-600")
      studentLoginBtn.classList.add("bg-blue-600", "hover:bg-blue-700")
    } else if (role === "faculty") {
      facultyLoginBtn.classList.remove("bg-gray-700", "hover:bg-gray-600")
      facultyLoginBtn.classList.add("bg-purple-600", "hover:bg-purple-700")
    } else if (role === "admin") {
      adminLoginBtn.classList.remove("bg-gray-700", "hover:bg-gray-600")
      adminLoginBtn.classList.add("bg-green-600", "hover:bg-green-700")
    }
  }

  // Form submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      // Simple validation
      if (!email || !password) {
        showNotification("Please enter both email and password", "error")
        return
      }

      try {
        // Attempt login with API
        const result = await window.EduAPI.login(email, password, currentRole)

        if (result.success) {
          showNotification("Login successful!", "success")
          redirectToDashboard(currentRole)
        } else {
          showNotification(result.message || "Invalid email or password", "error")
        }
      } catch (error) {
        showNotification(error.message || "Login failed", "error")
      }
    })
  }

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Add animation classes on scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll(".animate-on-scroll")

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top
      const windowHeight = window.innerHeight

      if (elementPosition < windowHeight - 100) {
        element.classList.add("animate__animated")
        element.classList.add(element.dataset.animation || "animate__fadeIn")
      }
    })
  }

  // Run animation check on load and scroll
  window.addEventListener("load", animateOnScroll)
  window.addEventListener("scroll", animateOnScroll)

  // Helper functions
  function redirectToDashboard(role) {
    if (role === "student") {
      window.location.href = "student-dashboard.html"
    } else if (role === "faculty") {
      window.location.href = "faculty-dashboard.html"
    } else if (role === "admin") {
      window.location.href = "admin-dashboard.html"
    }
  }

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
})

// Add signup functionality
document.addEventListener("DOMContentLoaded", () => {
  const signupLinks = document.querySelectorAll('a[href="#signup"]')

  signupLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Create signup modal
      const modal = document.createElement("div")
      modal.className = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      modal.id = "signupModal"

      modal.innerHTML = `
                <div class="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-purple-500 shadow-2xl animate__animated animate__fadeInDown">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-purple-400">Sign Up for EduAI</h2>
                        <button id="closeSignupBtn" class="text-gray-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="mb-6">
                        <div class="flex justify-center space-x-4 mb-6">
                            <button id="studentSignupBtn" class="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-300">Student</button>
                            <button id="facultySignupBtn" class="py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition duration-300">Faculty</button>
                            <button id="adminSignupBtn" class="py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition duration-300">Admin</button>
                        </div>
                        <form id="signupForm">
                            <div class="mb-4">
                                <label for="signupName" class="block text-gray-300 mb-2">Full Name</label>
                                <input type="text" id="signupName" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="Your Name" required>
                            </div>
                            <div class="mb-4">
                                <label for="signupEmail" class="block text-gray-300 mb-2">Email</label>
                                <input type="email" id="signupEmail" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="your@email.com" required>
                            </div>
                            <div class="mb-6">
                                <label for="signupPassword" class="block text-gray-300 mb-2">Password</label>
                                <input type="password" id="signupPassword" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white" placeholder="••••••••" required>
                            </div>
                            <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                                Sign Up
                            </button>
                        </form>
                    </div>
                    <div class="text-center text-gray-400">
                        <p>Already have an account? <a href="#" id="loginLink" class="text-purple-400 hover:text-purple-300">Log in</a></p>
                    </div>
                </div>
            `

      document.body.appendChild(modal)

      // Set up event listeners
      let signupRole = "student"

      document.getElementById("closeSignupBtn").addEventListener("click", () => {
        document.body.removeChild(modal)
      })

      document.getElementById("studentSignupBtn").addEventListener("click", () => {
        setSignupRole("student")
      })

      document.getElementById("facultySignupBtn").addEventListener("click", () => {
        setSignupRole("faculty")
      })

      document.getElementById("adminSignupBtn").addEventListener("click", () => {
        setSignupRole("admin")
      })

      document.getElementById("loginLink").addEventListener("click", (e) => {
        e.preventDefault()
        document.body.removeChild(modal)
        document.getElementById("loginBtn").click()
      })

      document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault()

        const name = document.getElementById("signupName").value
        const email = document.getElementById("signupEmail").value
        const password = document.getElementById("signupPassword").value

        if (!name || !email || !password) {
          window.showNotification("Please fill in all fields", "error")
          return
        }

        try {
          const result = await window.EduAPI.register(name, email, password, signupRole)

          if (result.success) {
            window.showNotification("Registration successful! You can now log in.", "success")
            document.body.removeChild(modal)
            document.getElementById("loginBtn").click()
          } else {
            window.showNotification(result.message || "Registration failed", "error")
          }
        } catch (error) {
          window.showNotification(error.message || "Registration failed", "error")
        }
      })

      function setSignupRole(role) {
        signupRole = role

        // Reset all buttons
        document.getElementById("studentSignupBtn").classList.remove("bg-blue-600", "hover:bg-blue-700")
        document.getElementById("studentSignupBtn").classList.add("bg-gray-700", "hover:bg-gray-600")

        document.getElementById("facultySignupBtn").classList.remove("bg-purple-600", "hover:bg-purple-700")
        document.getElementById("facultySignupBtn").classList.add("bg-gray-700", "hover:bg-gray-600")

        document.getElementById("adminSignupBtn").classList.remove("bg-green-600", "hover:bg-green-700")
        document.getElementById("adminSignupBtn").classList.add("bg-gray-700", "hover:bg-gray-600")

        // Set active button
        if (role === "student") {
          document.getElementById("studentSignupBtn").classList.remove("bg-gray-700", "hover:bg-gray-600")
          document.getElementById("studentSignupBtn").classList.add("bg-blue-600", "hover:bg-blue-700")
        } else if (role === "faculty") {
          document.getElementById("facultySignupBtn").classList.remove("bg-gray-700", "hover:bg-gray-600")
          document.getElementById("facultySignupBtn").classList.add("bg-purple-600", "hover:bg-purple-700")
        } else if (role === "admin") {
          document.getElementById("adminSignupBtn").classList.remove("bg-gray-700", "hover:bg-gray-600")
          document.getElementById("adminSignupBtn").classList.add("bg-green-600", "hover:bg-green-700")
        }
      }

      // Close when clicking outside
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          document.body.removeChild(modal)
        }
      })
    })
  })
})

