import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MyAccount() {
  const [vip, setVip] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const vipId = localStorage.getItem("vipId");

  useEffect(() => {
    if (!vipId) {
      setStatus({
        message: "No VIP ID found. Please log in again.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    const fetchVIP = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/vip/${vipId}`);
        const data = await res.json();
        if (res.ok) {
          setVip(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            password: "",
            dob: data.dob ? data.dob.split("T")[0] : "",
            phoneNumber: data.phoneNumber || "",
            commonWords: (data.commonWords || []).join(", "),
            designation: data.designation || "",
            publicAccountLinks: JSON.stringify(
              data.publicAccountLinks || {},
              null,
              2
            ),
            photos: (data.photos || []).join(", "),
          });
        } else {
          setStatus({
            message: data.message || "Failed to fetch account info",
            type: "error",
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setStatus({ message: "Error fetching account info", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchVIP();
  }, [vipId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });

    try {
      const body = {
        ...formData,
        commonWords: formData.commonWords
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        photos: formData.photos
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        publicAccountLinks: JSON.parse(formData.publicAccountLinks || "{}"),
      };

      if (!body.password) delete body.password;

      const res = await fetch(`http://localhost:5000/api/vip/${vipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (res.ok) {
        setStatus({
          message: "Profile updated successfully!",
          type: "success",
        });
        setVip(result);
        setIsEditing(false);
        navigate("/myacc");
      } else {
        setStatus({
          message: result.message || "Update failed",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      setStatus({ message: "Error updating account info", type: "error" });
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center text-neutral-700">Loading account...</div>
    );

  return (
    <div className="min-h-screen bg-neutral-50 p-6 font-sans">
      {/* --- Header --- */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 p-4 bg-white rounded-2xl shadow">
        <h1 className="text-3xl font-extrabold">My Account</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-neutral-800 text-white rounded-lg shadow hover:bg-neutral-900 transition"
        >
          Exit
        </button>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow max-w-3xl mx-auto">
        {!isEditing ? (
          // --- VIEW MODE ---
          <div className="space-y-4">
            <p>
              <span className="font-bold">Name:</span> {vip?.name}
            </p>
            <p>
              <span className="font-bold">Email:</span> {vip?.email}
            </p>
            <p>
              <span className="font-bold">DOB:</span>{" "}
              {vip?.dob ? new Date(vip.dob).toLocaleDateString() : "N/A"}
            </p>
            <p>
              <span className="font-bold">Phone:</span>{" "}
              {vip?.phoneNumber || "N/A"}
            </p>
            <p>
              <span className="font-bold">Designation:</span>{" "}
              {vip?.designation || "N/A"}
            </p>
            <p>
              <span className="font-bold">Common Words:</span>{" "}
              {(vip?.commonWords || []).join(", ")}
            </p>
            <p>
              <span className="font-bold">Links:</span>{" "}
              {JSON.stringify(vip?.publicAccountLinks || {}, null, 2)}
            </p>
            <p>
              <span className="font-bold">Photos:</span>{" "}
              {(vip?.photos || []).join(", ")}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 transition"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          // --- EDIT MODE ---
          <form onSubmit={handleSubmit} className="space-y-6">
            {[
              { label: "Full Name", name: "name", type: "text" },
              { label: "Email", name: "email", type: "email" },
              {
                label: "Password (leave blank to keep current)",
                name: "password",
                type: "password",
              },
              { label: "Date of Birth", name: "dob", type: "date" },
              { label: "Phone Number", name: "phoneNumber", type: "text" },
              {
                label: "Common Words (comma-separated)",
                name: "commonWords",
                type: "text",
              },
              { label: "Designation", name: "designation", type: "text" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            {/* JSON Links */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Public Account Links (JSON)
              </label>
              <textarea
                name="publicAccountLinks"
                value={formData.publicAccountLinks || ""}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border border-neutral-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Photo URLs (comma-separated)
              </label>
              <input
                type="text"
                name="photos"
                value={formData.photos || ""}
                onChange={handleChange}
                className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow hover:bg-green-700 transition"
              >
                Update Profile
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-neutral-400 text-white font-bold rounded-xl shadow hover:bg-neutral-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {status.message && (
          <p
            className={`mt-6 text-center text-sm font-semibold ${
              status.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
