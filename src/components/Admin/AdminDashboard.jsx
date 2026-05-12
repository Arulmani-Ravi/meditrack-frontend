import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function AdminDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const ADMIN_API_URL =
    "https://8vgc5ki3m3.execute-api.us-east-1.amazonaws.com/admin-medicines";

  const DELETE_MEDICINE_API_URL =
    "https://8vgc5ki3m3.execute-api.us-east-1.amazonaws.com/delete-medicine";

  const parseExpiryDate = (value) => {
    if (!value) return null;

    try {
      if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(value)) {
        const [d, m, y] = value.split(".");
        return new Date(
          `${y.length === 2 ? `20${y}` : y}-${m.padStart(
            2,
            "0"
          )}-${d.padStart(2, "0")}`
        );
      }

      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) {
        const [d, m, y] = value.split("/");
        return new Date(
          `${y.length === 2 ? `20${y}` : y}-${m.padStart(
            2,
            "0"
          )}-${d.padStart(2, "0")}`
        );
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
      return {
        key: "UNKNOWN",
        text: "UNKNOWN",
        className: "status-unknown",
      };
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (exp - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        key: "EXPIRED",
        text: "EXPIRED",
        className: "status-expired",
      };
    }

    if (diffDays <= 7) {
      return {
        key: "EXPIRING SOON",
        text: "EXPIRING SOON",
        className: "status-soon",
      };
    }

    return {
      key: "SAFE",
      text: "SAFE",
      className: "status-safe",
    };
  };

  const fetchAdminMedicines = async () => {
    try {
      const token = localStorage.getItem("idToken");

      const response = await axios.get(ADMIN_API_URL, {
        headers: {
          Authorization: token,
        },
      });

      let data = response.data;

      if (data.body) {
        data =
          typeof data.body === "string"
            ? JSON.parse(data.body)
            : data.body;
      }

      setMedicines(data.medicines || []);
      setTotalUsers(data.totalUsers || 0);
    } catch (error) {
      console.error("Admin fetch error:", error);
      setMessage("Failed to load admin data.");
    }
  };

  useEffect(() => {
    fetchAdminMedicines();
  }, []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const fileName = (medicine.fileName || "").toLowerCase();
      const medicineId = (medicine.medicineId || "").toLowerCase();
      const userId = (medicine.userId || "").toLowerCase();

      const status = getStatusInfo(medicine.expiryDate).key;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        fileName.includes(search) ||
        medicineId.includes(search) ||
        userId.includes(search);

      const matchesFilter =
        statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [medicines, searchTerm, statusFilter]);

  const getStats = () => {
    let expired = 0;
    let soon = 0;
    let safe = 0;
    let unknown = 0;

    medicines.forEach((medicine) => {
      const status = getStatusInfo(medicine.expiryDate).key;

      if (status === "EXPIRED") expired++;
      else if (status === "EXPIRING SOON") soon++;
      else if (status === "SAFE") safe++;
      else unknown++;
    });

    return {
      total: medicines.length,
      users: totalUsers,
      expired,
      soon,
      safe,
      unknown,
    };
  };

  const handleDelete = async (medicineId, fileName) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medicine?"
    );

    if (!confirmDelete) return;

    try {
      await axios.post(DELETE_MEDICINE_API_URL, {
        medicineId,
        fileName,
      });

      setMessage("Medicine deleted successfully.");

      fetchAdminMedicines();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Failed to delete medicine.");
    }
  };

  const stats = getStats();

  return (
    <div className="dashboard-wrapper">
      <div className="hero-card admin-hero">
        <h2 className="hero-title">Admin Dashboard</h2>

        <p className="hero-subtitle">
          Monitor all users, medicines, expiry status,
          and system records.
        </p>
      </div>

      {message && (
        <p className="status-message">{message}</p>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">
            Total Medicines
          </span>

          <span className="summary-value">
            {stats.total}
          </span>
        </div>

        <div className="summary-card">
          <span className="summary-label">
            Total Users
          </span>

          <span className="summary-value">
            {stats.users}
          </span>
        </div>

        <div className="summary-card expired-card">
          <span className="summary-label">
            Expired
          </span>

          <span className="summary-value">
            {stats.expired}
          </span>
        </div>

        <div className="summary-card soon-card">
          <span className="summary-label">
            Expiring Soon
          </span>

          <span className="summary-value">
            {stats.soon}
          </span>
        </div>

        <div className="summary-card safe-card">
          <span className="summary-label">
            Safe
          </span>

          <span className="summary-value">
            {stats.safe}
          </span>
        </div>

        <div className="summary-card">
          <span className="summary-label">
            Unknown
          </span>

          <span className="summary-value">
            {stats.unknown}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h3
            className="section-title"
            style={{ marginBottom: 0 }}
          >
            All Medicine Records
          </h3>

          <div className="filter-row">
            <input
              type="text"
              placeholder="Search by user, file name, or medicine ID"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="search-input"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="filter-select"
            >
              <option value="ALL">All</option>

              <option value="SAFE">Safe</option>

              <option value="EXPIRING SOON">
                Expiring Soon
              </option>

              <option value="EXPIRED">
                Expired
              </option>

              <option value="UNKNOWN">
                Unknown
              </option>
            </select>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <p className="empty-text">
            No records found.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Medicine ID</th>
                  <th>File Name</th>
                  <th>MFG Date</th>
                  <th>EXP Date</th>
                  <th>Status</th>
                  <th>Uploaded At</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map((medicine) => {
                  const statusInfo =
                    getStatusInfo(
                      medicine.expiryDate
                    );

                  return (
                    <tr key={medicine.medicineId}>
                      <td>
                        {medicine.userId || "-"}
                      </td>

                      <td>
                        {medicine.medicineId}
                      </td>

                      <td>
                        {medicine.fileName}
                      </td>

                      <td>
                        {medicine.manufacturingDate ||
                          "-"}
                      </td>

                      <td>
                        {medicine.expiryDate ||
                          "-"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${statusInfo.className}`}
                        >
                          {statusInfo.text}
                        </span>
                      </td>

                      <td>
                        {medicine.uploadedAt ||
                          "-"}
                      </td>

                      <td>
                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(
                              medicine.medicineId,
                              medicine.fileName
                            )
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

export default AdminDashboard;