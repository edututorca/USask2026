(function () {
  // Elements
  const titleInput = document.getElementById("docTitle");
  const fileInput = document.getElementById("docFile");
  const uploadBtn = document.getElementById("btnUploadDoc");
  const statusEl = document.getElementById("docStatus");

  if (!uploadBtn) return; // safety check

  uploadBtn.addEventListener("click", async () => {
    statusEl.textContent = "";
    statusEl.style.color = "";

    const title = (titleInput.value || "").trim();
    const file = fileInput.files && fileInput.files[0];

    // Basic validation
    if (!title) {
      statusEl.textContent = "Please enter a document title.";
      statusEl.style.color = "#a33";
      return;
    }

    if (!file) {
      statusEl.textContent = "Please select a file (PDF or PPT).";
      statusEl.style.color = "#a33";
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];

    if (!allowedTypes.includes(file.type)) {
      statusEl.textContent = "Only PDF and PowerPoint files are allowed.";
      statusEl.style.color = "#a33";
      return;
    }

    // Build form data
    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdf", file);

    try {
      uploadBtn.disabled = true;
      statusEl.textContent = "Uploading document...";
      statusEl.style.color = "#22345b";

      const response = await fetch(`${API_CONFIG.BASE_URL}/documents`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      // Success
      statusEl.textContent = `Document uploaded successfully (ID: ${data.documentId})`;
      statusEl.style.color = "green";

      // Optional reset
      fileInput.value = "";
      // titleInput.value = "";

    } catch (err) {
      console.error(err);
      statusEl.textContent = err.message || "Upload failed.";
      statusEl.style.color = "#a33";
    } finally {
      uploadBtn.disabled = false;
    }
  });
})();
