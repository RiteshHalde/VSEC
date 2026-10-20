const API_BASE = "http://localhost:5000";

const $ = (id) => document.getElementById(id);

let patients = [];
let editingId = null;

// Show message
function message(text, error = false) {
    alert(text);
}

// API request
async function api(path, options = {}) {
    const response = await fetch(API_BASE + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

// Load patient records
async function loadPatients() {
    try {
        patients = await api("/api/patients");
        renderPatients();
    } catch (error) {
        console.error(error);

        $("patientTableBody").innerHTML =
            `<tr><td colspan="8">
            Backend connection failed. Please start the backend.
            </td></tr>`;

        message("Backend सुरू आहे का तपासा!");
    }
}

// Display patients
function renderPatients() {
    const tbody = $("patientTableBody");

    const searchText = $("searchInput").value
        .toLowerCase()
        .trim();

    const filteredPatients = patients.filter(patient =>
        String(patient.name || "").toLowerCase().includes(searchText) ||
        String(patient.id || "").toLowerCase().includes(searchText) ||
        String(patient.condition || "").toLowerCase().includes(searchText)
    );

    $("totalPatients").textContent = patients.length;

    $("normalPatients").textContent =
        patients.filter(p => p.status === "Normal").length;

    $("warningPatients").textContent =
        patients.filter(p => p.status === "Warning").length;

    $("criticalPatients").textContent =
        patients.filter(p => p.status === "Critical").length;

    if (filteredPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center">
                    No patient records found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredPatients.map(patient => {
        let statusClass = "status-normal";

        if (patient.status === "Warning") {
            statusClass = "status-warning";
        } else if (patient.status === "Critical") {
            statusClass = "status-critical";
        }

        return `
            <tr>
                <td>${patient.id ?? ""}</td>
                <td>${escapeHTML(patient.name)}</td>
                <td>${patient.age ?? ""}</td>
                <td>${escapeHTML(patient.condition)}</td>
                <td>${patient.heartRate ?? ""} BPM</td>
                <td>${patient.temperature ?? ""} °C</td>
                <td>
                    <span class="status ${statusClass}">
                        ${escapeHTML(patient.status)}
                    </span>
                </td>
                <td>
                    <button class="action-button edit-button"
                        data-edit="${patient.id}">
                        Edit
                    </button>

                    <button class="action-button delete-button"
                        data-delete="${patient.id}">
                        Delete
                    </button>
                </td>
            </tr>`;
    }).join("");
}

// Protect HTML output
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Add or update patient
$("patientForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const patient = {
        name: $("name").value.trim(),
        age: Number($("age").value),
        condition: $("condition").value.trim(),
        heartRate: Number($("heartRate").value),
        temperature: Number($("temperature").value),
        status: $("status").value
    };

    if (!patient.name || !patient.condition) {
        message("Please fill all required fields.");
        return;
    }

    try {
        if (editingId !== null) {
            await api("/api/patients/" + encodeURIComponent(editingId), {
                method: "PUT",
                body: JSON.stringify(patient)
            });

            message("Patient updated successfully!");
        } else {
            await api("/api/patients", {
                method: "POST",
                body: JSON.stringify(patient)
            });

            message("Patient added successfully!");
        }

        resetForm();
        await loadPatients();

    } catch (error) {
        console.error(error);
        message("Error: " + error.message);
    }
});

// Edit and delete patient
$("patientTableBody").addEventListener("click", async function(event) {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;

    if (editId !== undefined) {
        const patient = patients.find(p =>
            String(p.id) === String(editId)
        );

        if (!patient) return;

        editingId = patient.id;

        $("name").value = patient.name ?? "";
        $("age").value = patient.age ?? "";
        $("condition").value = patient.condition ?? "";
        $("heartRate").value = patient.heartRate ?? "";
        $("temperature").value = patient.temperature ?? "";
        $("status").value = patient.status ?? "Normal";

        $("saveButton").textContent = "Update Patient";

        $("addPatient").scrollIntoView({
            behavior: "smooth"
        });
    }

    if (deleteId !== undefined) {
        if (!confirm("Are you sure you want to delete this patient?")) {
            return;
        }

        try {
            await api("/api/patients/" + encodeURIComponent(deleteId), {
                method: "DELETE"
            });

            message("Patient deleted successfully!");
            await loadPatients();

        } catch (error) {
            console.error(error);
            message("Delete failed: " + error.message);
        }
    }
});

// Reset form
function resetForm() {
    $("patientForm").reset();
    editingId = null;
    $("saveButton").textContent = "＋ Save Patient";
}

// Search
$("searchInput").addEventListener("input", renderPatients);

// Initialize
loadPatients();