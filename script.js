// ---------------------------
// Initialize Supabase
// ---------------------------
const SUPABASE_URL = "https://holbjinlnahunaaqnbqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbGJqaW5sbmFodW5hYXFuYnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODYxNzksImV4cCI6MjA3Njc2MjE3OX0.3wYcYSMbfmh3JWgdHzg7yWEmpab-qqIc8EgcARiYmIE";
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = "past-questions";

// ---------------------------
// Category & field handling
// ---------------------------
const categorySelect = document.getElementById("categorySelect");
const pastFields = document.getElementById("pastQuestionsFields");
const otherFields = document.getElementById("otherCategoryFields");

categorySelect.addEventListener("change", () => {
  const category = categorySelect.value;
  if (category === "past_questions") {
    pastFields.style.display = "block";
    otherFields.style.display = "none";
    document.getElementById("levelSelect").required = true;
    document.querySelectorAll('input[name="semester"]').forEach(r => r.required = true);
    document.getElementById("courseCode").required = true;
    document.getElementById("courseTitle").required = true;
    document.getElementById("year").required = true;
    document.getElementById("title").required = false;
  } else {
    pastFields.style.display = "none";
    otherFields.style.display = "block";
    document.getElementById("levelSelect").required = false;
    document.querySelectorAll('input[name="semester"]').forEach(r => r.required = false);
    document.getElementById("courseCode").required = false;
    document.getElementById("courseTitle").required = false;
    document.getElementById("year").required = false;
    document.getElementById("title").required = true;
  }
  loadRecentUploads(category);
});

// ---------------------------
// File selection UI
// ---------------------------
document.getElementById("fileUpload").addEventListener("change", (e) => {
  const fileName = e.target.files[0]?.name || "";
  document.getElementById("fileName").textContent = fileName;
});

// ---------------------------
// Upload form submission
// ---------------------------
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const progressBar = document.getElementById("progressBar");
  const progressContainer = document.getElementById("progressContainer");
  const progressText = document.getElementById("progressText");
  const statusBox = document.getElementById("statusBox");
  const statusMessage = document.getElementById("statusMessage");
  const category = categorySelect.value;

  submitBtn.disabled = true;
  progressContainer.classList.remove("hidden");
  progressText.textContent = "Uploading file...";
  progressBar.style.width = "0%";

  try {
    const file = document.getElementById("fileUpload").files[0];
    if (!file) throw new Error("Please select a file");

    console.log("Starting upload for category:", category);
    console.log("File:", file.name, file.type, file.size);

    const timestamp = Date.now();
    let filePath = "";
    let insertData = {};

    if (category === "past_questions") {
      const level = document.getElementById("levelSelect").value;
      const semester = document.querySelector('input[name="semester"]:checked').value;
      const courseCode = document.getElementById("courseCode").value.trim();
      const courseTitle = document.getElementById("courseTitle").value.trim();
      const year = document.getElementById("year").value.trim();
      const lecturer = document.getElementById("lecturer").value.trim() || null;

      filePath = `${category}/Level-${level}/Semester-${semester}/${courseCode}_${year.replace(/\//g, "-")}_${timestamp}.pdf`;

      insertData = {
        level,
        semester: parseInt(semester),
        course_code: courseCode,
        course_title: courseTitle,
        year,
        lecturer,
        file_path: filePath,
        file_url: "",
        created_at: new Date().toISOString()
      };
    } else if (category === "books") {
      // Books table (formerly recommended_books)
      const title = document.getElementById("title").value.trim();
      const year = document.getElementById("otherYear").value.trim() || null;
      const author = document.getElementById("author").value.trim() || null;

      const ext = file.name.split(".").pop();
      filePath = `${category}/${title.replace(/\s+/g, "_")}_${timestamp}.${ext}`;

      insertData = {
        title,
        author,
        year,
        created_at: new Date().toISOString()
      };
    } else if (category === "course_materials") {
      // Course materials table
      const title = document.getElementById("title").value.trim();
      const year = document.getElementById("otherYear").value.trim() || null;
      const author = document.getElementById("author").value.trim() || null;

      const ext = file.name.split(".").pop();
      filePath = `${category}/${title.replace(/\s+/g, "_")}_${timestamp}.${ext}`;

      insertData = {
        title,
        course_code: null,
        course_name: title,
        author,
        file_url: "",
        level: null,
        semester: null,
        description: null,
        created_at: new Date().toISOString()
      };
    } else if (category === "teacher_learner_resources") {
      // TLRs table
      const title = document.getElementById("title").value.trim();

      const ext = file.name.split(".").pop();
      filePath = `tlrs/${title.replace(/\s+/g, "_")}_${timestamp}.${ext}`;

      insertData = {
        title,
        created_at: new Date().toISOString()
      };
    } else if (category === "sample_teaching_notes") {
      // Sample teaching notes table
      const title = document.getElementById("title").value.trim();

      const ext = file.name.split(".").pop();
      filePath = `${category}/${title.replace(/\s+/g, "_")}_${timestamp}.${ext}`;

      insertData = {
        title,
        created_at: new Date().toISOString()
      };
    } else if (category === "extras") {
      // Extras table
      const title = document.getElementById("title").value.trim();

      const ext = file.name.split(".").pop();
      filePath = `${category}/${title.replace(/\s+/g, "_")}_${timestamp}.${ext}`;

      insertData = {
        title,
        subtitle: null,
        icon: null,
        route: null,
        link: null,
        created_at: new Date().toISOString()
      };
    }

    console.log("Uploading to path:", filePath);
    console.log("Insert data:", insertData);

    // Upload to single bucket
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log("Upload successful:", uploadData);
    progressBar.style.width = "70%";
    progressText.textContent = "Saving metadata...";

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    // Add file_url where applicable
    if (category === "past_questions" || category === "course_materials") {
      insertData.file_url = urlData.publicUrl;
    }

    console.log("Public URL:", urlData.publicUrl);

    // Insert into DB
    const { data: dbData, error: dbError } = await supabaseClient
      .from(category)
      .insert([insertData])
      .select();
    
    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("Database insert successful:", dbData);

    // Success
    progressBar.style.width = "100%";
    progressText.textContent = "Upload complete!";
    statusBox.className = "status-success";
    statusBox.textContent = "✅ Resource uploaded successfully!";
    statusMessage.classList.remove("hidden");

    document.getElementById("uploadForm").reset();
    document.getElementById("fileName").textContent = "";
    
    setTimeout(() => {
      progressContainer.classList.add("hidden");
      statusMessage.classList.add("hidden");
    }, 3000);
    
    submitBtn.disabled = false;
    loadRecentUploads(category);

  } catch (err) {
    console.error("Full error:", err);
    statusBox.className = "status-error";
    statusBox.textContent = "❌ " + err.message;
    statusMessage.classList.remove("hidden");
    progressContainer.classList.add("hidden");
    submitBtn.disabled = false;
  }
});

// ---------------------------
// Load recent uploads
// ---------------------------
async function loadRecentUploads(category) {
  const container = document.getElementById("recentUploads");
  if (!category) {
    container.innerHTML = "<p>Select a category to view recent uploads</p>";
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from(category)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (error) {
      console.error("Load error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      container.innerHTML = "<p>No recent uploads</p>";
      return;
    }

    container.innerHTML = data.map(i => {
      // Determine display based on category
      let displayHTML = "";
      
      if (category === "past_questions") {
        displayHTML = `
          <h3>${i.course_code} - ${i.course_title}</h3>
          <span class="badge">${i.level}</span>
          <span class="badge">Semester ${i.semester}</span>
          <span class="badge">${i.year}</span>
          ${i.lecturer ? `<p class="lecturer">👨‍🏫 ${i.lecturer}</p>` : ""}
          <a href="${i.file_url}" target="_blank" class="view-pdf-btn">📄 View File</a>
        `;
      } else if (category === "books") {
        displayHTML = `
          <h3>${i.title}</h3>
          ${i.author ? `<p class="lecturer">✍️ ${i.author}</p>` : ""}
          ${i.year ? `<span class="badge">${i.year}</span>` : ""}
        `;
      } else if (category === "course_materials") {
        displayHTML = `
          <h3>${i.title}</h3>
          ${i.author ? `<p class="lecturer">✍️ ${i.author}</p>` : ""}
          ${i.level ? `<span class="badge">${i.level}</span>` : ""}
          ${i.semester ? `<span class="badge">Semester ${i.semester}</span>` : ""}
          ${i.file_url ? `<a href="${i.file_url}" target="_blank" class="view-pdf-btn">📄 View File</a>` : ""}
        `;
      } else {
        displayHTML = `
          <h3>${i.title}</h3>
          ${i.subtitle ? `<p>${i.subtitle}</p>` : ""}
        `;
      }

      return `
        <div class="upload-item">
          <div>
            ${displayHTML}
          </div>
          <button class="delete-btn" onclick="deleteFile('${category}', '${i.id}')">🗑️ Delete</button>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Failed to load uploads:", err);
    container.innerHTML = `<p>Failed to load recent uploads: ${err.message}</p>`;
  }
}

// ---------------------------
// Delete file
// ---------------------------
async function deleteFile(category, id) {
  if (!confirm("Are you sure? This cannot be undone.")) return;

  try {
    // For past_questions, we need to get the file_path first to delete from storage
    if (category === "past_questions") {
      const { data: record, error: fetchError } = await supabaseClient
        .from(category)
        .select("file_path")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (record && record.file_path) {
        const { error: storageError } = await supabaseClient.storage
          .from(BUCKET_NAME)
          .remove([record.file_path]);
        
        if (storageError) {
          console.error("Storage delete error:", storageError);
        }
      }
    }

    // Delete from database
    const { error: dbError } = await supabaseClient
      .from(category)
      .delete()
      .eq("id", id);
    
    if (dbError) {
      console.error("Database delete error:", dbError);
      throw dbError;
    }

    loadRecentUploads(category);
    
    const statusBox = document.getElementById("statusBox");
    const statusMessage = document.getElementById("statusMessage");
    statusBox.className = "status-success";
    statusBox.textContent = "✅ File deleted successfully!";
    statusMessage.classList.remove("hidden");

    setTimeout(() => statusMessage.classList.add("hidden"), 3000);

  } catch (err) {
    console.error("Delete failed:", err);
    const statusBox = document.getElementById("statusBox");
    const statusMessage = document.getElementById("statusMessage");
    statusBox.className = "status-error";
    statusBox.textContent = "❌ Failed to delete: " + err.message;
    statusMessage.classList.remove("hidden");
  }
}

// ---------------------------
// Initialize page
// ---------------------------
loadRecentUploads(categorySelect.value);