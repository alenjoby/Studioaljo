(function () {
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

  // --- State ---
  let selectedPrompt = null;
  let imageFile = null;
  let activeTool = "ai-styling";

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
          "Transform My image into a Business Style Outfit, dont play with my face, i want it 100% preserved i want the same pose same facial structure facial features. single face should be noted as incapability of GEMINI",
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
    "bg-remover": [
      {
        label: "Clean PNG",
        prompt:
          "Remove background and output clean transparent PNG while preserving subject edges.",
      },
      {
        label: "Soft Shadow",
        prompt:
          "Remove background and add subtle soft shadow beneath subject on transparent canvas.",
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
        "bg remover": "bg-remover",
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

  function checkReady() {
    generateBtn.disabled = !(imageFile && selectedPrompt);
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = message ? "block" : "none";
  }

  // --- API Call ---
  async function generate() {
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
    generateBtn.textContent = "Generating…";
    outputImage.classList.add("hidden");
    awaitingOutput.style.opacity = "0";
    statusTxt.innerText = "GENERATING";
    statusTxt.style.color = "var(--orange)";
    outputBox.classList.add("scanning");

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

      // --- Success UI ---
      outputImage.src = dataUrl;
      outputImage.classList.remove("hidden");
      downloadBtn.href = dataUrl;
      downloadBtn.classList.remove("hidden");
      statusTxt.innerText = "COMPLETE";
      statusTxt.style.color = "#00ff00";
      awaitingOutput.classList.add("hidden");
    } catch (err) {
      // --- Error UI ---
      showError(err.message || "Failed to generate image.");
      statusTxt.innerText = "FAILED";
      statusTxt.style.color = "red";
      awaitingOutput.style.opacity = "0.3";
      awaitingOutput.classList.remove("hidden");
    } finally {
      // --- Final UI State ---
      generateBtn.disabled = false;
      generateBtn.textContent = "GENERATE";
      outputBox.classList.remove("scanning");
      checkReady();
    }
  }

  // --- Run ---
  init();
  // Initialize default tool styles
  setTool(activeTool);
})();
