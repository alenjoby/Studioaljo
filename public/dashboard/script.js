// Dashboard functionality
(function () {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const uploadPreview = document.getElementById("uploadPreview");
  const outputPreview = document.getElementById("outputPreview");
  const generateBtn = document.getElementById("generateBtn");
  const uploadBox = document.querySelector(".upload-box");
  const outputBox = document.querySelector(".output-box");
  const toolBtns = document.querySelectorAll(".tool-btn");
  const promptBtns = document.querySelectorAll(".prompt-btn");

  let uploadedImage = null;
  let selectedTool = "ai-styling";
  let selectedPrompt = null;

  // File upload click
  uploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  });

  // Drag and drop
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("drag-over");
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("drag-over");
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  });

  // Handle image upload
  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = e.target.result;
      uploadPreview.src = uploadedImage;
      uploadPreview.hidden = false;
      uploadArea.hidden = true;
      generateBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  // Tool selection
  toolBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toolBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedTool = btn.dataset.tool;
    });
  });

  // Prompt selection
  promptBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      promptBtns.forEach((b) => (b.style.background = "#ff6b00"));
      btn.style.background =
        "linear-gradient(135deg, #ff6b00 0%, #ff8533 100%)";
      selectedPrompt = btn.textContent;
    });
  });

  // Generate button
  generateBtn.addEventListener("click", () => {
    if (!uploadedImage) {
      alert("Please upload an image first!");
      return;
    }

    generateBtn.textContent = "GENERATING...";
    generateBtn.disabled = true;

    // Simulate AI processing (replace with actual API call)
    setTimeout(() => {
      // For demo, just show the uploaded image in output
      outputPreview.src = uploadedImage;
      outputPreview.hidden = false;
      document.querySelector(".output-placeholder").hidden = true;

      generateBtn.textContent = "GENERATE";
      generateBtn.disabled = false;
    }, 2000);
  });

  // Initial state
  generateBtn.disabled = true;
})();
