// Tab switching functionality
document.getElementById("loginTab").addEventListener("click", function () {
  setActiveTab("login");
});

document.getElementById("signupTab").addEventListener("click", function () {
  setActiveTab("signup");
});

document
  .getElementById("switchToSignup")
  .addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("signup");
  });

document
  .getElementById("switchToLogin")
  .addEventListener("click", function (e) {
    e.preventDefault();
    setActiveTab("login");
  });

function setActiveTab(tab) {
  const authCard = document.querySelector(".auth-card");

  // Add shake animation to card
  authCard.classList.add("switching");
  setTimeout(() => {
    authCard.classList.remove("switching");
  }, 500);

  // Update tab buttons
  document
    .getElementById("loginTab")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("signupTab")
    .classList.toggle("active", tab === "signup");

  // Show/hide forms with transition
  document
    .getElementById("loginFormContainer")
    .classList.toggle("hidden", tab !== "login");
  document
    .getElementById("signupFormContainer")
    .classList.toggle("hidden", tab !== "signup");

  // Clear error messages
  document.getElementById("loginErrorMessage").textContent = "";
  document.getElementById("signupErrorMessage").textContent = "";
}

// Login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessageElement = document.getElementById("loginErrorMessage");

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();

    // Check if response is empty
    if (!text) {
      errorMessageElement.textContent =
        "Server error: Empty response. Please try again.";
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      errorMessageElement.textContent =
        "Server error: Invalid response format. Please try again.";
      console.error("JSON parse error:", parseError);
      return;
    }

    if (response.ok) {
      // Login successful
      // Store user data in localStorage
      localStorage.setItem("studioaljo_user", JSON.stringify(data.user));
      localStorage.setItem("studioaljo_auth", "true");
      // Also set a lightweight auth cookie for server-side gating
      // Expires in 7 days, scoped to site root
      document.cookie =
        "studioaljo_auth=true; Max-Age=" +
        7 * 24 * 60 * 60 +
        "; Path=/; SameSite=Lax";
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } else {
      errorMessageElement.textContent =
        data.error || "Login failed. Please try again.";
    }
  } catch (error) {
    errorMessageElement.textContent =
      "Network error: " +
      error.message +
      ". Please check your connection and try again.";
    console.error("Login error:", error);
  }
});

// Signup form submission
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorMessageElement = document.getElementById("signupErrorMessage");

  console.log("Signup form submitted with:", {
    name,
    email,
    password,
    confirmPassword,
  }); // Debug log

  // Basic validation
  if (password !== confirmPassword) {
    errorMessageElement.textContent = "Passwords do not match.";
    return;
  }

  if (password.length < 6) {
    errorMessageElement.textContent = "Password must be at least 6 characters.";
    return;
  }

  // Show loading state
  const submitButton = document.querySelector("#signupForm .btn");
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = "Creating account...";
  submitButton.disabled = true;

  try {
    console.log("Sending request to /users"); // Debug log
    const response = await fetch("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    console.log("Received response:", response); // Debug log

    const text = await response.text();
    console.log("Signup response text:", text);
    console.log("Signup response status:", response.status);

    // Check if response is empty
    if (!text) {
      errorMessageElement.textContent =
        "Server error: Empty response. Please try again.";
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      errorMessageElement.textContent =
        "Server error: Invalid response format. Please try again.";
      console.error("JSON parse error:", parseError);
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      return;
    }

    if (response.ok) {
      // Signup successful
      alert("Account created successfully! You can now login.");
      setActiveTab("login");
      // Clear the signup form
      document.getElementById("signupForm").reset();
    } else {
      errorMessageElement.textContent =
        data.error ||
        "Signup failed with status " + response.status + ". Please try again.";
    }
  } catch (error) {
    errorMessageElement.textContent =
      "Network error: " +
      error.message +
      ". Please check your connection and try again.";
    console.error("Signup error:", error);
  } finally {
    // Reset loading state
    const submitButton = document.querySelector("#signupForm .btn");
    if (submitButton) {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  }
});

// Interactive video background with mouse movement
(function () {
  const video = document.querySelector(".video-background");
  if (!video) return;

  let mouseX = 0;
  let mouseY = 0;
  let targetPlaybackRate = 1;
  let currentPlaybackRate = 1;

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX / window.innerWidth; // 0 to 1
    mouseY = e.clientY / window.innerHeight; // 0 to 1

    // Calculate playback rate based on mouse position (0.5x to 2x speed)
    const speed = 0.5 + mouseX * 1.5;
    targetPlaybackRate = speed;

    // Apply transform to video based on mouse position for parallax effect
    const moveX = (mouseX - 0.5) * 20; // -10 to 10
    const moveY = (mouseY - 0.5) * 20; // -10 to 10
    video.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
  });

  // Smooth playback rate transition
  function updatePlaybackRate() {
    currentPlaybackRate += (targetPlaybackRate - currentPlaybackRate) * 0.1;
    video.playbackRate = currentPlaybackRate;
    requestAnimationFrame(updatePlaybackRate);
  }

  // Start the smooth transition
  updatePlaybackRate();

  // Add brightness/saturation filter based on mouse position
  document.addEventListener("mousemove", (e) => {
    const brightness = 0.8 + mouseY * 0.4; // 0.8 to 1.2
    const saturation = 0.9 + mouseX * 0.3; // 0.9 to 1.2
    video.style.filter = `brightness(${brightness}) saturate(${saturation})`;
  });

  // Pause video on mouse leave, resume on mouse enter
  document.addEventListener("mouseleave", () => {
    video.pause();
  });

  document.addEventListener("mouseenter", () => {
    video.play();
  });
})();

// Google Sign-In Handler for Login/Signup
function handleGoogleLogin(response) {
  const idToken = response.credential;

  // Send token to backend for verification
  fetch("/api/google-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: idToken }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        // Store user data
        localStorage.setItem("studioaljo_user", JSON.stringify(data.user));
        localStorage.setItem("studioaljo_auth", "true");
        // Set auth cookie for server-side gating
        document.cookie =
          "studioaljo_auth=true; Max-Age=" +
          60 * 60 * 24 * 7 +
          "; Path=/; SameSite=Lax";
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        document.getElementById("loginErrorMessage").textContent =
          data.message || "Google authentication failed";
      }
    })
    .catch((error) => {
      console.error("Google login error:", error);
      document.getElementById("loginErrorMessage").textContent =
        "Failed to authenticate with Google. Please try again.";
    });
}

// Make function globally available for Google Sign-In callback
window.handleGoogleLogin = handleGoogleLogin;
