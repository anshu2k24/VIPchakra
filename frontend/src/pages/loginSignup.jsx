import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginSignup() {
  const [isCreating, setIsCreating] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    phoneNumber: "",
    commonWords: "",
    designation: "",
    publicAccountLinks: "",
    photos: "",
  });
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ message: "", type: "" });

    try {
      if (isCreating) {
        if (!otpSent) {
          // Step 1: Send OTP
          const res = await fetch("http://localhost:5000/api/vip/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              name: formData.name,
              password: formData.password,
            }),
          });

          const result = await res.json();
          if (res.ok) {
            setOtpSent(true);
            setStatus({ message: "OTP sent to email!", type: "success" });
          } else {
            setStatus({
              message: result.message || "Failed to send OTP",
              type: "error",
            });
          }
        } else {
          // Step 2: Verify OTP + Create VIP
          const res = await fetch("http://localhost:5000/api/vip/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              otp,
              commonWords: formData.commonWords
                ? formData.commonWords.split(",").map((s) => s.trim())
                : [],
              photos: formData.photos
                ? formData.photos.split(",").map((s) => s.trim())
                : [],
              publicAccountLinks: formData.publicAccountLinks
                ? JSON.parse(formData.publicAccountLinks || "{}")
                : {},
            }),
          });

          const result = await res.json();
          if (res.ok) {
            setStatus({
              message: "Account created successfully! You can log in now.",
              type: "success",
            });
            setFormData({
              name: "",
              email: "",
              password: "",
              dob: "",
              phoneNumber: "",
              commonWords: "",
              designation: "",
              publicAccountLinks: "",
              photos: "",
            });
            setOtp("");
            setOtpSent(false);
            setIsCreating(false); // switch back to login
          } else {
            setStatus({
              message: result.message || "OTP verification failed",
              type: "error",
            });
          }
        }
      } else {
        // Login
        const res = await fetch("http://localhost:5000/api/vip/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const result = await res.json();
        if (res.ok) {
          localStorage.setItem("vipId", result.vipId);
          navigate("/dashboard");
        } else {
          setStatus({
            message: result.message || "Login failed",
            type: "error",
          });
        }
      }
    } catch (err) {
      console.error(err);
      setStatus({ message: "Server error", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setIsCreating(false);
              setOtpSent(false);
              setOtp("");
            }}
            className={`flex-1 py-2 font-bold ${
              !isCreating
                ? "border-b-2 border-black text-black"
                : "text-gray-500"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className={`flex-1 py-2 font-bold ${
              isCreating
                ? "border-b-2 border-black text-black"
                : "text-gray-500"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCreating && !otpSent && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </>
          )}

          {isCreating && otpSent && (
            <>
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="text"
                name="designation"
                placeholder="Job Title"
                value={formData.designation}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                name="commonWords"
                placeholder="Keywords (comma-separated)"
                value={formData.commonWords}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                name="publicAccountLinks"
                placeholder='Social Links (JSON: {"github": "..."})'
                value={formData.publicAccountLinks}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg font-mono"
              />
              <textarea
                name="photos"
                placeholder="Image URLs (comma-separated)"
                value={formData.photos}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </>
          )}

          {!isCreating && (
            <>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition"
          >
            {isSubmitting
              ? "Processing..."
              : isCreating
              ? otpSent
                ? "Verify OTP & Sign Up"
                : "Send OTP"
              : "Login"}
          </button>
        </form>

        {status.message && (
          <p
            className={`mt-4 text-center font-semibold ${
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
