(function () {
  // --- Auth Check: Redirect to login if not authenticated ---
  const isAuthenticated = localStorage.getItem("studioaljo_auth") === "true";
  const user = JSON.parse(localStorage.getItem("studioaljo_user") || "null");

  if (!isAuthenticated || !user) {
    alert("Please login to access the dashboard");
    window.location.href = "/login";
    return;
  }

  // --- Elements ---
  const fileInput = document.getElementById("file-input");
  const sourcePreview = document.getElementById("input-img");
  const outputImage = document.getElementById("output-img");
  const awaitingOutput = document.getElementById("output-placeholder");
  const previewPromptBox = document.getElementById("preview-prompt");
  const generateBtn = document.getElementById("generate-btn");
  const errorBox = document.getElementById("error-box");
  const stylesList = document.getElementById("styles-list");
  const toolsRail = document.querySelector(".tools-rail");
  const dropZone = document.getElementById("drop-zone");
  const uploadUi = document.getElementById("upload-ui");
  const clearBtn = document.getElementById("clear-btn");
  const imgRes = document.getElementById("img-res");
  const outputBox = document.getElementById("output-box");
  const statusTxt = document.getElementById("status-txt");
  const downloadBtn = document.getElementById("download-btn");
  const backBtn = document.getElementById("back-btn");
  const btnContainer = document.getElementById("btn-container");
  const progressBar = document.getElementById("progress-bar");
  const btnTextLabel = document.getElementById("btn-text-label");
  const quotaPill = document.getElementById("quota-pill");

  // --- State ---
  let selectedPrompt = null;
  let imageFile = null;
  let personImageFile = null;
  let outfitImageFile = null;
  let activeTool = "ai-styling";

  // --- Quota Management ---
  function getQuotaKey() {
    const today = new Date().toISOString().split("T")[0];
    return `studioaljo_quota_${user.email}_${today}`;
  }

  function getQuotaUsed() {
    return parseInt(localStorage.getItem(getQuotaKey()) || "0");
  }

  function incrementQuota() {
    const current = getQuotaUsed();
    localStorage.setItem(getQuotaKey(), (current + 1).toString());
    updateQuotaDisplay();
  }

  function updateQuotaDisplay() {
    const used = getQuotaUsed();
    const remaining = 10 - used;
    quotaPill.textContent = `${remaining}/10 Generations Available Today`;

    if (remaining <= 0) {
      quotaPill.style.borderColor = "red";
      quotaPill.style.color = "red";
    } else if (remaining <= 3) {
      quotaPill.style.borderColor = "orange";
      quotaPill.style.color = "orange";
    }
  }

  function checkQuotaLimit() {
    return getQuotaUsed() >= 10;
  }

  // --- Tool -> Styles definitions ---
  const TOOL_SETS = {
    "ai-styling": [
      {
        label: "Streetwear",
        prompt:
          "Transform the outfit into trendy modern streetwear style with oversized graphic hoodie, distressed baggy jeans, chunky sneakers, baseball cap worn backwards, gold chain necklace, and casual urban attitude. Keep the person's face and pose the same.",
      },
      {
        label: "Evening Gown",
        prompt:
          "Transform into an elegant evening look with a luxurious floor-length gown in deep emerald green or midnight blue, sleek updo hairstyle with elegant waves, statement diamond earrings, sophisticated makeup with bold red lips, and confident glamorous pose. Maintain facial features.",
      },
      {
        label: "Business Pro",
        prompt:
          "Change outfit to sharp business professional attire with tailored navy blue suit, crisp white dress shirt, silk tie, polished leather shoes, neat combed hairstyle, professional grooming, confident executive posture. Keep the same person and facial features.",
      },
      {
        label: "Bohemian",
        prompt:
          "Transform My outfit into black Suit, black suit pant,professional and black shirt with first 2 buttons undone which adds a classy style to the outfit, dont play with my face, i want it 100% preserved i want the same pose same facial structure facial features. single face should be noted as incapability of GEMINI",
      },
      {
        label: "Punk Rock",
        prompt:
          "Transform into edgy rockstar punk style with ripped black leather jacket covered in metal studs and patches, band t-shirt, torn skinny jeans, combat boots, spiked or colorful dyed hair (mohawk or wild style), dark smokey eye makeup, multiple piercings, rebellious attitude. Keep face recognizable.",
      },
      {
        label: "K-pop Idol",
        prompt:
          "Transform into trendy K-pop idol style with colorful pastel hair (pink, lavender, or mint), perfectly styled with volume and shine, coordinated fashion-forward outfit with crop top and high-waisted pants, dewy glowing skin, gradient lips, aegyo sal under eyes, youthful energetic pose. Maintain person's identity.",
      },
      {
        label: "90s Hip-Hop",
        prompt:
          "Transform into classic 90s hip-hop fashion with oversized baggy jeans sagging slightly, colorful windbreaker or Starter jacket, Timberland boots or Air Jordans, bucket hat or durag, thick gold chain, hoop earrings, cornrows or box braids hairstyle, throwback urban swagger. Keep facial features intact.",
      },
      {
        label: "Vintage Glam",
        prompt:
          "Transform into 1950s Hollywood glamour style with vintage polka dot or wiggle dress, perfectly curled retro hairstyle with victory rolls, winged eyeliner, red lipstick, pearl necklace, white gloves, classic hourglass silhouette, elegant pose like Marilyn Monroe or Audrey Hepburn. Preserve person's face.",
      },
      {
        label: "Steampunk",
        prompt:
          "Transform the outfit into elaborate Victorian steampunk fashion with brass goggles with amber lenses, ornate clockwork gears integrated into clothing, rich leather corsets and straps with buckles, copper pipes and valves as accessories, layered Victorian tailored coat with epaulettes, top hat with gears, weathered industrial textures, mechanical pocket watches, and intricate retrofuturistic details. Keep person's face the same.",
      },
      {
        label: "Athleisure",
        prompt:
          "Transform into trendy athleisure sporty Look (a sports bra and sports pant), dont play with my face, i want it 100% preserved i want the same pose same facial structure facial features. single face should be noted as incapability of GEMINI",
      },
    ],
    "room-makeover": [
      {
        label: "Minimalist",
        prompt:
          "Restyle room into minimalist theme with neutral palette, clean lines, decluttered decor, natural light emphasis.",
      },
      {
        label: "Scandinavian",
        prompt:
          "Apply Scandinavian design: light woods, soft textiles, muted tones, cozy hygge accents, functional layout.",
      },
      {
        label: "Industrial",
        prompt:
          "Industrial makeover: exposed brick, metal fixtures, darker tones, reclaimed wood furniture, pendant lighting.",
      },
      {
        label: "Boho",
        prompt:
          "Bohemian decor: layered textiles, plants, warm colors, eclectic patterns, relaxed seating, artisanal accents.",
      },
    ],
    "meme-maker": [
      {
        label: "Classic Top/Bottom",
        prompt:
          "Add witty top and bottom captions in Impact font. Keep subject visible and readable.",
      },
      {
        label: "Two-Panel",
        prompt:
          "Create a two-panel meme layout with contrasting captions illustrating a humorous comparison.",
      },
      {
        label: "Reaction",
        prompt:
          "Overlay a short reaction caption and add subtle border for shareable format.",
      },
    ],
    "ai-avatar": [
      {
        label: "Anime",
        prompt:
          "Generate stylized anime avatar from selfie while preserving key facial features and identity.",
      },
      {
        label: "Cyberpunk",
        prompt:
          "Create cyberpunk avatar with neon accents, tech accessories, futuristic styling. Keep facial structure.",
      },
      {
        label: "Pixel Art",
        prompt:
          "Convert selfie to pixel art avatar at medium resolution, clear facial cues retained.",
      },
    ],
    "outfit-tryon": [
      {
        label: "Try On",
        prompt: "FIXED_PROMPT",
        isFixed: true,
      },
    ],
  };

  // --- Init ---
  function init() {
    lucide.createIcons();
    addEventListeners();
    checkReady();
  }

  // --- Event Listeners ---
  function addEventListeners() {
    // Tools rail switching
    toolsRail.addEventListener("click", (e) => {
      const btn = e.target.closest(".rail-btn");
      if (!btn) return;

      // Determine tool key from button text
      const label = btn.textContent.trim().toLowerCase();
      const map = {
        "ai styling": "ai-styling",
        "room makeover": "room-makeover",
        "meme maker": "meme-maker",
        "ai avatar generator": "ai-avatar",
        "outfit try-on": "outfit-tryon",
      };
      const nextTool = map[label] || "ai-styling";

      // Active class
      for (const b of toolsRail.querySelectorAll(".rail-btn")) {
        b.classList.remove("rail-btn--active");
      }
      btn.classList.add("rail-btn--active");

      // Update styles list
      setTool(nextTool);
    });
    // Style button interactions
    stylesList.addEventListener("click", (e) => {
      const btn = e.target.closest(".style-btn");
      if (!btn) return;

      for (const b of stylesList.querySelectorAll(".style-btn")) {
        b.classList.remove("active");
      }

      btn.classList.add("active");
      selectedPrompt = btn.dataset.prompt;
      previewPromptBox.textContent =
        `"${selectedPrompt}"` || "Select a style to see its prompt.";
      checkReady();
    });

    // Image Upload
    dropZone.addEventListener("click", (e) => {
      // Let the clear button handle its own clicks
      if (e.target.closest("#clear-btn")) return;
      if (!imageFile) fileInput.click();
    });
    fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    // Drag and Drop
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--orange)";
    });
    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#222";
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#222";
      handleFile(e.dataTransfer.files[0]);
    });

    // Clear Button
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      imageFile = null;
      fileInput.value = "";
      sourcePreview.classList.add("hidden");
      sourcePreview.src = "";
      uploadUi.classList.remove("hidden");
      clearBtn.classList.add("hidden");
      imgRes.classList.add("hidden");
      checkReady();
    });

    // Generate Button
    generateBtn.addEventListener("click", generate);

    // Dual-image upload for outfit try-on
    const personDropZone = document.getElementById("person-drop-zone");
    const personFileInput = document.getElementById("person-file-input");
    const personPreview = document.getElementById("person-img");
    const personUploadUi = document.getElementById("person-upload-ui");
    const personClearBtn = document.getElementById("person-clear-btn");
    const personRes = document.getElementById("person-res");

    const outfitDropZone = document.getElementById("outfit-drop-zone");
    const outfitFileInput = document.getElementById("outfit-file-input");
    const outfitPreview = document.getElementById("outfit-img");
    const outfitUploadUi = document.getElementById("outfit-upload-ui");
    const outfitClearBtn = document.getElementById("outfit-clear-btn");
    const outfitRes = document.getElementById("outfit-res");

    // Person upload click
    personDropZone.addEventListener("click", (e) => {
      if (e.target.closest("#person-clear-btn")) return;
      if (!personImageFile) personFileInput.click();
    });
    personFileInput.addEventListener("change", (e) =>
      handlePersonFile(e.target.files[0])
    );

    // Outfit upload click
    outfitDropZone.addEventListener("click", (e) => {
      if (e.target.closest("#outfit-clear-btn")) return;
      if (!outfitImageFile) outfitFileInput.click();
    });
    outfitFileInput.addEventListener("change", (e) =>
      handleOutfitFile(e.target.files[0])
    );

    // Person drag and drop
    personDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      personDropZone.style.borderColor = "var(--orange)";
    });
    personDropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      personDropZone.style.borderColor = "#222";
    });
    personDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      personDropZone.style.borderColor = "#222";
      handlePersonFile(e.dataTransfer.files[0]);
    });

    // Outfit drag and drop
    outfitDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      outfitDropZone.style.borderColor = "var(--orange)";
    });
    outfitDropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      outfitDropZone.style.borderColor = "#222";
    });
    outfitDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      outfitDropZone.style.borderColor = "#222";
      handleOutfitFile(e.dataTransfer.files[0]);
    });

    // Person clear button
    personClearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      personImageFile = null;
      personFileInput.value = "";
      personPreview.classList.add("hidden");
      personPreview.src = "";
      personUploadUi.classList.remove("hidden");
      personClearBtn.classList.add("hidden");
      personRes.classList.add("hidden");
      checkReady();
    });

    // Outfit clear button
    outfitClearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      outfitImageFile = null;
      outfitFileInput.value = "";
      outfitPreview.classList.add("hidden");
      outfitPreview.src = "";
      outfitUploadUi.classList.remove("hidden");
      outfitClearBtn.classList.add("hidden");
      outfitRes.classList.add("hidden");
      checkReady();
    });
  }
  function setTool(toolKey) {
    activeTool = toolKey;
    const items = TOOL_SETS[toolKey] || [];
    stylesList.innerHTML = items
      .map(
        (it) =>
          `<button class="style-btn" data-prompt="${it.prompt.replace(
            /"/g,
            "&quot;"
          )}">${it.label}</button>`
      )
      .join("");

    // Toggle between single and dual upload layouts
    const singleUploadZone = document.getElementById("single-upload-zone");
    const personUploadZone = document.getElementById("person-upload-zone");
    const outfitUploadZone = document.getElementById("outfit-upload-zone");
    const canvasContainer = document.getElementById("canvas-container");

    if (toolKey === "outfit-tryon") {
      // Show dual upload zones
      singleUploadZone.classList.add("hidden");
      personUploadZone.classList.remove("hidden");
      outfitUploadZone.classList.remove("hidden");
      canvasContainer.style.gridTemplateColumns = "1fr 1fr 1fr";
    } else {
      // Show single upload zone
      singleUploadZone.classList.remove("hidden");
      personUploadZone.classList.add("hidden");
      outfitUploadZone.classList.add("hidden");
      canvasContainer.style.gridTemplateColumns = "1fr 1fr";
    }

    // Reset selected prompt when tool changes
    selectedPrompt = null;
    previewPromptBox.textContent = "Select a style to see its prompt.";
    checkReady();
  }

  // --- Logic ---
  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showError("Unsupported file type. Please use an image.");
      return;
    }
    showError(""); // Clear error
    imageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      sourcePreview.src = e.target.result;

      const i = new Image();
      i.src = e.target.result;
      i.onload = () => {
        imgRes.innerText = `${i.naturalWidth} x ${i.naturalHeight} PX`;
        imgRes.classList.remove("hidden");
      };

      sourcePreview.classList.remove("hidden");
      uploadUi.classList.add("hidden");
      clearBtn.classList.remove("hidden");

      // Reset Output
      outputImage.classList.add("hidden");
      outputImage.src = "";
      awaitingOutput.style.opacity = "0.3";
      awaitingOutput.classList.remove("hidden");
      downloadBtn.classList.add("hidden");
      statusTxt.innerText = "IDLE";
      statusTxt.style.color = "#555";
      checkReady();
    };
    reader.readAsDataURL(file);
  }

  function handlePersonFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showError("Unsupported file type. Please use an image.");
      return;
    }
    showError("");
    personImageFile = file;

    const personPreview = document.getElementById("person-img");
    const personUploadUi = document.getElementById("person-upload-ui");
    const personClearBtn = document.getElementById("person-clear-btn");
    const personRes = document.getElementById("person-res");

    const reader = new FileReader();
    reader.onload = (e) => {
      personPreview.src = e.target.result;

      const i = new Image();
      i.src = e.target.result;
      i.onload = () => {
        personRes.innerText = `${i.naturalWidth} x ${i.naturalHeight} PX`;
        personRes.classList.remove("hidden");
      };

      personPreview.classList.remove("hidden");
      personUploadUi.classList.add("hidden");
      personClearBtn.classList.remove("hidden");
      checkReady();
    };
    reader.readAsDataURL(file);
  }

  function handleOutfitFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showError("Unsupported file type. Please use an image.");
      return;
    }
    showError("");
    outfitImageFile = file;

    const outfitPreview = document.getElementById("outfit-img");
    const outfitUploadUi = document.getElementById("outfit-upload-ui");
    const outfitClearBtn = document.getElementById("outfit-clear-btn");
    const outfitRes = document.getElementById("outfit-res");

    const reader = new FileReader();
    reader.onload = (e) => {
      outfitPreview.src = e.target.result;

      const i = new Image();
      i.src = e.target.result;
      i.onload = () => {
        outfitRes.innerText = `${i.naturalWidth} x ${i.naturalHeight} PX`;
        outfitRes.classList.remove("hidden");
      };

      outfitPreview.classList.remove("hidden");
      outfitUploadUi.classList.add("hidden");
      outfitClearBtn.classList.remove("hidden");
      checkReady();
    };
    reader.readAsDataURL(file);
  }

  function checkReady() {
    const quotaExceeded = checkQuotaLimit();

    if (quotaExceeded) {
      generateBtn.disabled = true;
      showError("Daily quota limit reached (10/10). Come back tomorrow!");
      return;
    }

    if (activeTool === "outfit-tryon") {
      generateBtn.disabled = !(personImageFile && outfitImageFile);
    } else {
      generateBtn.disabled = !(imageFile && selectedPrompt);
    }
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = message ? "block" : "none";
  }

  // --- API Call ---
  async function generate() {
    // Check quota limit
    if (checkQuotaLimit()) {
      showError("Daily quota limit reached (10/10). Come back tomorrow!");
      return;
    }

    // Outfit Try-On Logic
    if (activeTool === "outfit-tryon") {
      if (!personImageFile) {
        showError("Please upload your photo first.");
        return;
      }
      if (!outfitImageFile) {
        showError("Please upload an outfit photo.");
        return;
      }

      showError("");
      generateBtn.disabled = true;
      btnContainer.classList.add("generating-active");
      outputImage.classList.add("hidden");
      awaitingOutput.style.opacity = "0";
      statusTxt.innerText = "GENERATING";
      statusTxt.style.color = "var(--orange)";
      outputBox.classList.add("scanning");

      // Simulated Progress Bar Animation
      let progress = 0;
      const progressInterval = setInterval(() => {
        if (progress < 90) {
          progress += Math.random() * 5;
          if (progress > 90) progress = 90;
          progressBar.style.width = `${progress}%`;
          btnTextLabel.innerText = `GENERATING ${Math.floor(progress)}%`;
        }
      }, 100);

      try {
        const fd = new FormData();
        fd.append("personImage", personImageFile);
        fd.append("outfitImage", outfitImageFile);

        const res = await fetch("/api/images/outfit-tryon", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Server error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const { dataUrl } = data;

        clearInterval(progressInterval);
        progressBar.style.width = "100%";
        btnTextLabel.innerText = "COMPLETE";

        // Small delay to show 100%
        setTimeout(() => {
          outputImage.src = dataUrl;
          outputImage.classList.remove("hidden");
          downloadBtn.href = dataUrl;
          downloadBtn.classList.remove("hidden");
          statusTxt.innerText = "COMPLETE";
          statusTxt.style.color = "#00ff00";
          awaitingOutput.classList.add("hidden");
          outputBox.classList.remove("scanning");
          btnContainer.classList.remove("generating-active");

          // Increment quota after successful generation
          incrementQuota();
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        btnTextLabel.innerText = "ERROR";
        progressBar.style.backgroundColor = "red";
        showError(err.message || "Failed to generate outfit try-on.");
        statusTxt.innerText = "FAILED";
        statusTxt.style.color = "red";
        awaitingOutput.style.opacity = "0.3";
        awaitingOutput.classList.remove("hidden");
        outputBox.classList.remove("scanning");
      } finally {
        setTimeout(() => {
          generateBtn.disabled = false;
          progressBar.style.width = "0%";
          progressBar.style.backgroundColor = "var(--orange)";
          btnTextLabel.innerText = "GENERATE";
          checkReady();
        }, 2000);
      }
      return;
    }

    // Existing logic for other tools
    if (!imageFile) {
      showError("Please upload an image first.");
      return;
    }
    if (!selectedPrompt) {
      showError("Please select a style button on the right.");
      return;
    }

    // --- Start UI ---
    showError("");
    generateBtn.disabled = true;
    btnContainer.classList.add("generating-active");
    outputImage.classList.add("hidden");
    awaitingOutput.style.opacity = "0";
    statusTxt.innerText = "GENERATING";
    statusTxt.style.color = "var(--orange)";
    outputBox.classList.add("scanning");

    // Simulated Progress Bar Animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 5;
        if (progress > 90) progress = 90;
        progressBar.style.width = `${progress}%`;
        btnTextLabel.innerText = `GENERATING ${Math.floor(progress)}%`;
      }
    }, 100);

    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("prompt", selectedPrompt);

      const res = await fetch("/api/images/edit", { method: "POST", body: fd });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const { dataUrl } = data;

      clearInterval(progressInterval);
      progressBar.style.width = "100%";
      btnTextLabel.innerText = "COMPLETE";

      // Small delay to show 100%
      setTimeout(() => {
        // --- Success UI ---
        outputImage.src = dataUrl;
        outputImage.classList.remove("hidden");
        downloadBtn.href = dataUrl;
        downloadBtn.classList.remove("hidden");
        statusTxt.innerText = "COMPLETE";
        statusTxt.style.color = "#00ff00";
        awaitingOutput.classList.add("hidden");
        outputBox.classList.remove("scanning");
        btnContainer.classList.remove("generating-active");

        // Increment quota after successful generation
        incrementQuota();
      }, 500);
    } catch (err) {
      // --- Error UI ---
      clearInterval(progressInterval);
      btnTextLabel.innerText = "ERROR";
      progressBar.style.backgroundColor = "red";
      showError(err.message || "Failed to generate image.");
      statusTxt.innerText = "FAILED";
      statusTxt.style.color = "red";
      awaitingOutput.style.opacity = "0.3";
      awaitingOutput.classList.remove("hidden");
      outputBox.classList.remove("scanning");
    } finally {
      // --- Final UI State ---
      setTimeout(() => {
        generateBtn.disabled = false;
        progressBar.style.width = "0%";
        progressBar.style.backgroundColor = "var(--orange)";
        btnTextLabel.innerText = "GENERATE";
        checkReady();
      }, 2000);
    }
  }

  // --- Back/Logout Handler ---
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("studioaljo_user");
        localStorage.removeItem("studioaljo_auth");
        window.location.href = "/";
      }
    });
  }

  // --- Run ---
  init();
  // Initialize default tool styles
  setTool(activeTool);
  // Initialize quota display
  updateQuotaDisplay();
})();
