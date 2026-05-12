import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

function UploadMedicine() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const UPLOAD_API_URL =
    "https://8vgc5ki3m3.execute-api.us-east-1.amazonaws.com/upload-url";
  const EXTRACT_API_URL =
    "https://8vgc5ki3m3.execute-api.us-east-1.amazonaws.com/extract-text";
  const GET_MEDICINES_API_URL =
    "https://8vgc5ki3m3.execute-api.us-east-1.amazonaws.com/get-medicines";
  const DELETE_MEDICINE_API_URL =
    "https://8vgc5ki3m3.execute-api.us-east-1.amazonaws.com/delete-medicine";

  const parseExpiryDate = (value) => {
    if (!value) return null;

    try {
      if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(value)) {
        const [d, m, y] = value.split(".");
        return new Date(`${y.length === 2 ? `20${y}` : y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
      }

      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) {
        const [d, m, y] = value.split("/");
        return new Date(`${y.length === 2 ? `20${y}` : y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
      }

      if (/^\d{1,2}\/\d{4}$/.test(value)) {
        const [m, y] = value.split("/");
        return new Date(`${y}-${m.padStart(2, "0")}-28`);
      }

      return null;
    } catch {
      return null;
    }
  };

  const getStatusInfo = (expiryDateValue) => {
    const exp = parseExpiryDate(expiryDateValue);

    if (!exp || Number.isNaN(exp.getTime())) {
      return { key: "UNKNOWN", text: "UNKNOWN", className: "status-unknown" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { key: "EXPIRED", text: "EXPIRED", className: "status-expired" };
    }

    if (diffDays <= 7) {
      return {
        key: "EXPIRING SOON",
        text: "EXPIRING SOON",
        className: "status-soon",
      };
    }

    return { key: "SAFE", text: "SAFE", className: "status-safe" };
  };

  const fetchMedicines = async () => {
    try {
      const currentUser = localStorage.getItem("userEmail") || "demo-user";

      const response = await axios.get(GET_MEDICINES_API_URL, {
        params: { userId: currentUser },
      });

      let parsedData = response.data;

      if (parsedData.body) {
        parsedData =
          typeof parsedData.body === "string"
            ? JSON.parse(parsedData.body)
            : parsedData.body;
      }

      setMedicines(parsedData.medicines || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  useEffect(() => {
    fetchMedicines();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const fileName = (medicine.fileName || "").toLowerCase();
      const medicineId = (medicine.medicineId || "").toLowerCase();
      const currentStatus = getStatusInfo(medicine.expiryDate).key;

      const matchesSearch =
        fileName.includes(searchTerm.toLowerCase()) ||
        medicineId.includes(searchTerm.toLowerCase());

      const matchesFilter =
        statusFilter === "ALL" ? true : currentStatus === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [medicines, searchTerm, statusFilter]);

  const getSummaryCounts = () => {
    let total = filteredMedicines.length;
    let expired = 0;
    let soon = 0;
    let safe = 0;

    filteredMedicines.forEach((medicine) => {
      const status = getStatusInfo(medicine.expiryDate).key;
      if (status === "EXPIRED") expired++;
      else if (status === "EXPIRING SOON") soon++;
      else if (status === "SAFE") safe++;
    });

    return { total, expired, soon, safe };
  };

  const resetLatestResult = () => {
    setMessage("");
    setUploadedFileName("");
    setExtractedText("");
    setManufacturingDate("");
    setExpiryDate("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    resetLatestResult();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setStream(mediaStream);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      setMessage("Camera access denied or not available.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());

    setStream(null);
    setCameraOpen(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const capturedFile = new File(
          [blob],
          `camera-scan-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        setFile(capturedFile);
        resetLatestResult();
        setMessage("Camera image captured. Click Upload Image.");
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        setMessage("Please select an image first.");
        return;
      }

      setLoading(true);
      setMessage("Uploading image...");

      const uploadResponse = await axios.get(UPLOAD_API_URL, {
        params: {
          fileType: file.type,
          fileName: file.name,
        },
      });

      let uploadData = uploadResponse.data;

      if (uploadData.body) {
        uploadData =
          typeof uploadData.body === "string"
            ? JSON.parse(uploadData.body)
            : uploadData.body;
      }

      const uploadUrl = uploadData.uploadUrl;
      const fileName = uploadData.fileName;

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      setUploadedFileName(fileName);
      setMessage("Extracting text and saving medicine...");

      const currentUser = localStorage.getItem("userEmail") || "demo-user";

      const extractResponse = await axios.post(EXTRACT_API_URL, {
        fileName,
        userId: currentUser,
      });

      let parsedData = extractResponse.data;

      if (parsedData.body) {
        parsedData =
          typeof parsedData.body === "string"
            ? JSON.parse(parsedData.body)
            : parsedData.body;
      }

      setExtractedText(parsedData.extractedText || "");
      setManufacturingDate(parsedData.manufacturingDate || "Not found");
      setExpiryDate(parsedData.expiryDate || "Not found");
      setMessage("Upload, extraction, and save successful!");

      fetchMedicines();
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicineId, fileName) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this medicine?"
      );
      if (!confirmDelete) return;

      await axios.post(DELETE_MEDICINE_API_URL, {
        medicineId,
        fileName,
      });

      setMessage("Medicine deleted successfully.");
      fetchMedicines();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Failed to delete medicine.");
    }
  };

  const summary = getSummaryCounts();

  return (
    <div className="dashboard-wrapper">
      <div className="hero-card">
        <h2 className="hero-title">MediTrack Dashboard</h2>
        <p className="hero-subtitle">
          Upload or scan a medicine image, extract expiry dates, and manage your records.
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Visible Medicines</span>
          <span className="summary-value">{summary.total}</span>
        </div>
        <div className="summary-card expired-card">
          <span className="summary-label">Expired</span>
          <span className="summary-value">{summary.expired}</span>
        </div>
        <div className="summary-card soon-card">
          <span className="summary-label">Expiring Soon</span>
          <span className="summary-value">{summary.soon}</span>
        </div>
        <div className="summary-card safe-card">
          <span className="summary-label">Safe</span>
          <span className="summary-value">{summary.safe}</span>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Upload Medicine Image</h3>

        <div className="upload-box">
          <input
            id="medicineFile"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,image/*"
            onChange={handleFileChange}
            className="file-input"
          />

          <label htmlFor="medicineFile" className="file-label">
            Choose Image
          </label>

          <span className="selected-file">
            {file ? file.name : "No file selected"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="primary-btn" onClick={startCamera} type="button">
            📷 Open Camera
          </button>

          <button
            className="primary-btn"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload Image"}
          </button>
        </div>

        {cameraOpen && (
          <div style={{ marginTop: "20px" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxWidth: "460px",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
              }}
            />

            <br />
            <br />

            <button className="primary-btn" onClick={captureImage} type="button">
              Capture Image
            </button>

            <button
              className="delete-btn"
              onClick={stopCamera}
              type="button"
              style={{ marginLeft: "10px" }}
            >
              Close Camera
            </button>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {message && <p className="status-message">{message}</p>}
      </div>

      {(uploadedFileName || manufacturingDate || expiryDate) && (
        <div className="card">
          <h3 className="section-title">Extraction Result</h3>

          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">File Name</span>
              <span className="result-value">{uploadedFileName || "-"}</span>
            </div>

            <div className="result-item">
              <span className="result-label">MFG Date</span>
              <span className="result-value">{manufacturingDate || "-"}</span>
            </div>

            <div className="result-item">
              <span className="result-label">EXP Date</span>
              <span className="result-value">{expiryDate || "-"}</span>
            </div>
          </div>
        </div>
      )}

      {extractedText && (
        <div className="card">
          <h3 className="section-title">Extracted Text</h3>
          <textarea
            value={extractedText}
            readOnly
            rows="8"
            className="text-area"
          />
        </div>
      )}

      <div className="card">
        <div className="table-header-row">
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            My Saved Medicines
          </h3>

          <div className="filter-row">
            <input
              type="text"
              placeholder="Search by file name or medicine ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All</option>
              <option value="SAFE">Safe</option>
              <option value="EXPIRING SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <p className="empty-text">No medicines match this search/filter.</p>
        ) : (
          <div className="table-wrapper">
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>Medicine ID</th>
                  <th>File Name</th>
                  <th>MFG Date</th>
                  <th>EXP Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map((medicine) => {
                  const statusInfo = getStatusInfo(medicine.expiryDate);

                  return (
                    <tr key={medicine.medicineId}>
                      <td>{medicine.medicineId}</td>
                      <td>{medicine.fileName}</td>
                      <td>{medicine.manufacturingDate || "-"}</td>
                      <td>{medicine.expiryDate || "-"}</td>
                      <td>
                        <span className={`status-badge ${statusInfo.className}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(medicine.medicineId, medicine.fileName)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadMedicine;