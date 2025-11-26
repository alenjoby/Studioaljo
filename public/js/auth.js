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
  // Update tab buttons
  document
    .getElementById("loginTab")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("signupTab")
    .classList.toggle("active", tab === "signup");

  // Show/hide forms
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
    console.log("Login response text:", text);
    console.log("Login response status:", response.status);

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
  const submitButton = document.querySelector("#signupForm .submit-btn");
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

    console.log("Signup response status:", response.status);
    console.log("Signup response data:", data);

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
    const submitButton = document.querySelector("#signupForm .submit-btn");
    if (submitButton) {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  }
});
