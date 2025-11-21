// Dashboard functionality
(function () {
  // Note: Authentication will be added later
  // const userData = localStorage.getItem("studioaljo_user");
  // if (!userData) {
  //   window.location.href = "/login";
  //   return;
  // }

  // Get elements
  const fileInput = document.getElementById("image-upload");
  const uploadLabel = document.querySelector(".drag-drop");
  const generateBtn = document.querySelector(".generate-btn");
  const inputImageArea = document.querySelector(".INPUT-IMAGE");
  const outputImageArea = document.querySelector(".OUTPUT-IMAGE");

  // Tool buttons
  const toolBtns = document.querySelectorAll(
    '[class*="-btn"]:not(.back-btn):not(.generate-btn)'
  );
  const promptBtns = document.querySelectorAll(".rectangle, .rectangle-2");

  let uploadedImage = null;
  let selectedTool = "ai-styling";
  let selectedPrompt = null;

  // File input change
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    });
  }

  // Drag and drop
  if (uploadLabel) {
    uploadLabel.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadLabel.style.opacity = "0.7";
    });

    uploadLabel.addEventListener("dragleave", () => {
      uploadLabel.style.opacity = "1";
    });

    uploadLabel.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadLabel.style.opacity = "1";

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    });
  }

  // Handle image upload
  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = e.target.result;

      // Update input area with uploaded image
      if (inputImageArea) {
        const existingImg = inputImageArea.querySelector(
          "img.uploaded-preview"
        );
        if (existingImg) {
          existingImg.src = uploadedImage;
        } else {
          const img = document.createElement("img");
          img.src = uploadedImage;
          img.className = "uploaded-preview";
          img.style.maxWidth = "100%";
          img.style.maxHeight = "100%";
          img.style.objectFit = "contain";
          uploadLabel.style.display = "none";
          inputImageArea.appendChild(img);
        }
      }

      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.style.opacity = "1";
        generateBtn.style.cursor = "pointer";
      }
    };
    reader.readAsDataURL(file);
  }

  // Tool selection
  toolBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toolBtns.forEach((b) => (b.style.opacity = "0.7"));
      btn.style.opacity = "1";

      // Get tool name from class
      const className = btn.className;
      if (className.includes("ai-styling")) selectedTool = "ai-styling";
      else if (className.includes("room-makeover"))
        selectedTool = "room-makeover";
      else if (className.includes("meme-maker")) selectedTool = "meme-maker";
      else if (className.includes("ai-avatar-gen"))
        selectedTool = "ai-avatar-gen";
      else if (className.includes("bg-remove")) selectedTool = "bg-remove";

      console.log("Selected tool:", selectedTool);
    });
  });

  // Prompt selection
  promptBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      promptBtns.forEach((b) => {
        b.style.background = "#ff6b00";
      });
      btn.style.background =
        "linear-gradient(135deg, #ff6b00 0%, #ff8533 100%)";
      selectedPrompt = `Prompt ${index + 1}`;
      console.log("Selected prompt:", selectedPrompt);
    });
  });

  // Generate button
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      if (!uploadedImage) {
        alert("Please upload an image first!");
        return;
      }

      const textElement = generateBtn.querySelector(".text-wrapper-9");
      if (textElement) {
        textElement.textContent = "GENERATING...";
      }
      generateBtn.disabled = true;

      // Simulate AI processing (replace with actual API call)
      setTimeout(() => {
        // Display result in output area
        if (outputImageArea) {
          const existingImg =
            outputImageArea.querySelector("img.output-preview");
          if (existingImg) {
            existingImg.src = uploadedImage;
          } else {
            const img = document.createElement("img");
            img.src = uploadedImage;
            img.className = "output-preview";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.objectFit = "contain";
            img.style.marginTop = "20px";

            const textWrapper =
              outputImageArea.querySelector(".text-wrapper-8");
            if (textWrapper) {
              textWrapper.insertAdjacentElement("afterend", img);
            } else {
              outputImageArea.appendChild(img);
            }
          }
        }

        if (textElement) {
          textElement.textContent = "GENERATE";
        }
        generateBtn.disabled = false;

        console.log(
          `Generated image using ${selectedTool} with ${
            selectedPrompt || "default prompt"
          }`
        );
      }, 2000);
    });

    // Initial state
    generateBtn.disabled = true;
    generateBtn.style.opacity = "0.5";
    generateBtn.style.cursor = "not-allowed";
  }
})();
