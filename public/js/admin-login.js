// Admin login form submission
document
  .getElementById("adminLoginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;
    const errorMessageElement = document.getElementById("errorMessage");

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - store session token and redirect
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/admin/dashboard?token=" + data.token;
      } else {
        errorMessageElement.textContent =
          data.error || "Invalid credentials. Please try again.";
      }
    } catch (error) {
      errorMessageElement.textContent = "Network error: " + error.message;
      console.error("Admin login error:", error);
    }
  });

// Google Sign-In Handler for Admin Login
function handleGoogleAdminLogin(response) {
  const idToken = response.credential;

  // Send token to backend for verification
  fetch("/api/google-admin-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: idToken }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        console.log("Google admin authentication successful");
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/admin/dashboard?token=" + data.token;
      } else {
        document.getElementById("errorMessage").textContent =
          data.message || "Google authentication failed or unauthorized";
      }
    })
    .catch((error) => {
      console.error("Google admin login error:", error);
      document.getElementById("errorMessage").textContent =
        "Failed to authenticate with Google. Please try again.";
    });
}

// Make function globally available for Google Sign-In callback
window.handleGoogleAdminLogin = handleGoogleAdminLogin;
