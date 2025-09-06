const mongoose = require('mongoose');

// This schema defines the structure for storing VIP details.
const vipSchema = new mongoose.Schema({
    // Full name of the VIP. It is a required field.
    name: {
        type: String,
        required: true,
        trim: true
    },
    // The VIP's email address. It is required and must be unique.
    email: {
        type: String,
        required: true,
        unique: true
    },
    // The VIP's password (hashed before saving).
    password: {
        type: String,
        required: true
    },
    // Date of birth.
    dob: {
        type: Date
    },
    // Phone number.
    phoneNumber: {
        type: String
    },
    // Keywords for categorization/search.
    commonWords: {
        type: [String],
        default: []
    },
    // The VIP's designation or public role.
    designation: {
        type: String
    },
    // Links to public accounts (Twitter, LinkedIn, etc.).
    publicAccountLinks: {
        type: Map,
        of: String
    },
    // Store original photo URLs (from user input).
    photos: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length <= 5;
            },
            message: props =>
                `${props.value.length} photos provided, but the limit is 5.`,
        },
        default: []
    },
    // Store local file paths of downloaded photos.
    localPhotos: {
        type: [String],
        default: []
    },
    // Flagged posts associated with this VIP.
    flaggedPostIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ]
});

// Prevent OverwriteModelError
const VIP = mongoose.models.VIP || mongoose.model("VIP", vipSchema);

module.exports = VIP;
