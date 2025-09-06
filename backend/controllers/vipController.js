const VIP = require("../models/VIPModel");
const Otp = require("../models/Otpmodel");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { sendOtpEmail, sendWelcomeEmailVIP } = require("../services/emailServices");

/**
 * Utility to download an image from URL and save to file.
 */
const downloadImage = async (url, filepath) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

/**
 * Generate random OTP
 */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Step 1 → Register VIP (request OTP)
 */
const registerVIP = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password required." });
    }

    const existingVIP = await VIP.findOne({ email });
    if (existingVIP) {
      return res
        .status(409)
        .json({ message: "A VIP with this email already exists." });
    }

    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store OTP in DB (valid for 5 min)
    await Otp.findOneAndUpdate(
      { email },
      {
        email,
        otp: hashedOtp,
        name,
        password,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // expires in 5 min
      },
      { upsert: true, new: true }
    );

    // Send OTP to email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: "OTP sent to email. Verify to complete registration.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

/**
 * Step 2 → Verify OTP & Create VIP
 */
const verifyOtpAndCreateVIP = async (req, res) => {
  try {
    const {
      email,
      otp,
      dob,
      phoneNumber,
      commonWords,
      designation,
      publicAccountLinks,
      photos,
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required." });
    }

    const record = await Otp.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: "OTP not found or expired." });
    }

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Hash password now
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(record.password, salt);

    // 📂 Create VIP folder
    const vipFolder = path.resolve(
      __dirname,
      "../../ml_services/vip_db",
      record.name.replace(/\s+/g, "_")
    );
    if (!fs.existsSync(vipFolder)) {
      fs.mkdirSync(vipFolder, { recursive: true });
    }

    // 🖼 Download images
    let localPhotos = [];
    if (Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        try {
          if (!photos[i]) continue;
          const ext = path.extname(new URL(photos[i]).pathname) || ".jpg";
          const filename = `photo_${i + 1}${ext}`;
          const filepath = path.join(vipFolder, filename);

          await downloadImage(photos[i], filepath);
          localPhotos.push(filepath);
        } catch (err) {
          console.error(
            `❌ Failed to download image: ${photos[i]}`,
            err.message
          );
        }
      }
    }

    // Create VIP
    const newVIP = new VIP({
      name: record.name,
      email,
      password: hashedPassword,
      dob,
      phoneNumber,
      commonWords,
      designation,
      publicAccountLinks,
      photos: photos || [],
      localPhotos: localPhotos,
    });

    const vip = await newVIP.save();

    // Delete OTP record
    await Otp.deleteOne({ email });

    // ✅ Send welcome email
    await sendWelcomeEmailVIP(email, vip.name);

    res.status(201).json({
      message: "✅ VIP created successfully after OTP verification!",
      vip: {
        _id: vip._id,
        name: vip.name,
        email: vip.email,
        dob: vip.dob,
        designation: vip.designation,
        photos: vip.photos,
        localPhotos: vip.localPhotos,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

/**
 * Login VIP
 */
const loginVIP = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const vip = await VIP.findOne({ email });
    if (!vip) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, vip.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.status(200).json({ message: "Login successful!", vipId: vip._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

/**
 * Get VIP details
 */
const getVIP = async (req, res) => {
  try {
    const vip = await VIP.findById(req.params.id).populate(
      "flaggedPostIds",
      "username content flagStatus flagReasons"
    );

    if (!vip) {
      return res.status(404).json({ message: "VIP not found." });
    }

    const vipData = vip.toObject();
    delete vipData.password;

    res.status(200).json(vipData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error." });
  }
};

/**
 * Update VIP
 */
const updateVIP = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    } else {
      delete updates.password;
    }

    const updatedVIP = await VIP.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedVIP) {
      return res.status(404).json({ message: "VIP not found." });
    }

    const vipData = updatedVIP.toObject();
    delete vipData.password;

    res.status(200).json({
      message: "VIP updated successfully!",
      vip: vipData,
    });
  } catch (err) {
    console.error(err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  registerVIP, // Step 1
  verifyOtpAndCreateVIP, // Step 2
  loginVIP,
  getVIP,
  updateVIP,
};
