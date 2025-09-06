const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createPost,
  getPosts,
  getFlaggedProfiles,
} = require("../controllers/postController");

const {
  registerVIP,
  verifyOtpAndCreateVIP,
  loginVIP,
  getVIP,
  updateVIP,
} = require("../controllers/vipController");

const upload = multer({ storage: multer.memoryStorage() });

/* -------------------- POSTS -------------------- */
router.post("/posts", upload.single("image"), createPost);
router.get("/posts", getPosts);
router.get("/flagged-profiles", getFlaggedProfiles);

/* -------------------- VIPs (with OTP auth) -------------------- */
// Step 1 → Request OTP
router.post("/vip/register", registerVIP);

// Step 2 → Verify OTP + Create VIP account
router.post("/vip/verify", verifyOtpAndCreateVIP);

// Login
router.post("/vip/login", loginVIP);

// Profile (protected routes in frontend)
router.get("/vip/:id", getVIP);
router.patch("/vip/:id", updateVIP);

module.exports = router;
