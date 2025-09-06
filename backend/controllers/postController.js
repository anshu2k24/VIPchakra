const axios = require('axios');
const mongoose = require('mongoose');
const Post = require('../models/FlaggedPostModel');
const VIP = require('../models/VIPModel');
const FlaggedProfile = require('../models/FlaggedProfileModel');
const dotenv = require("dotenv");
const FormData = require('form-data');
const fs = require('fs');
const { sendFlagAlertEmail } = require('../services/emailServices');
// const Post = require('../models/FlaggedPostModell');
// const FlaggedProfile = require('../models/FlaggedProfileModel');

dotenv.config();

// Define separate URLs for text and image analysis
const PYTHON_TEXT_API_URL = 'http://127.0.0.1:8001/analyze/text/';
const PYTHON_IMAGE_API_URL = 'http://127.0.0.1:8001/analyze/image/';

/**
 * Helper function to escape special characters in a string for use in a regular expression.
 * @param {string} string The input string with potentially special regex characters.
 * @returns {string} The escaped string.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calls the custom Python model to generate an embedding and check for content reuse.
 * @param {string} content The user-submitted content to check.
 * @param {Array<string>} existingEmbeddings A list of embeddings from existing posts.
 * @returns {Promise<object>} An object with the new embedding and a boolean for content reuse.
 */
async function checkContentWithPythonModel(content, existingEmbeddings) {
    let result = {
        is_reused_content: false,
        embedding: null
    };
    
    try {
        const response = await fetch(PYTHON_TEXT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: content,
                existing_embeddings: existingEmbeddings
            })
        });
        
        // Ensure the response is OK before attempting to parse as JSON.
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error calling Python API: ${response.status} - ${response.statusText}`);
            console.error('Response Body:', errorBody);
            return result;
        }

        const pythonData = await response.json();
        
        if (pythonData.is_reused_content) {
            result.is_reused_content = true;
        }
        
        if (pythonData.new_embedding) {
            result.embedding = pythonData.new_embedding;
        }

    } catch (error) {
        console.error("Error calling Python API for embeddings:", error);
    }

    return result;
}

/**
 * Calls the Python vision model to analyze an image.
 * @param {Buffer} imageData The image data to send.
 * @returns {Promise<object>} The analysis results from the model.
 */
async function checkImageWithPythonModel(imageData) {
    const formData = new FormData();
    formData.append('file', imageData, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });
 
    try {
      const response = await axios.post(PYTHON_IMAGE_API_URL, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error calling Python image API:", error.message);
      return { phash: null, faces: [] };
    }
}

/**
 * Calls the Gemini Flash API to check for general harmful content.
 * @param {string} content The user-submitted content to check.
 * @returns {Promise<object>} An object containing the flagStatus ('ok' or 'flagged') and a flagReason.
 */
async function checkContentWithGemini(content) {
    const systemPrompt = "You are a content moderation expert. Analyze the user's post content for any text that is: threatening to public figures or individuals, factually incorrect, or misused in a harmful way (e.g., spam, phishing). If the content is harmful, respond with a JSON object. If the content is clean, respond with a JSON object indicating it is clean. Do not include any other text in your response.";
    
    const apiKey = process.env.Gemini_api;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: content }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "flagStatus": {
                        "type": "STRING",
                        "description": "Indicates if the content is flagged. Use 'flagged' or 'ok'."
                    },
                    "flagReason": {
                        "type": "STRING",
                        "description": "A brief explanation of why the content was flagged. Use 'N/A' if not flagged."
                    }
                },
                "propertyOrdering": ["flagStatus", "flagReason"]
            }
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error from Gemini API: ${response.status} - ${response.statusText}`);
            console.error('Response Body:', errorBody);
            return { flagStatus: 'ok', flagReason: 'Gemini API call failed' };
        }

        const result = await response.json();

        if (result.promptFeedback && result.promptFeedback.blockReason) {
            return {
                flagStatus: 'flagged',
                flagReason: `Content blocked by API: ${result.promptFeedback.blockReason}`
            };
        }

        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
             const parsedJson = JSON.parse(candidate.content.parts[0].text);
             return parsedJson;
        } else if (candidate) {
            return { flagStatus: 'flagged', flagReason: 'Content was blocked by Gemini safety filters.'};
        }
        else {
            console.error("Gemini API returned an unexpected response structure.");
            return { flagStatus: 'ok', flagReason: 'API response issue' };
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return { flagStatus: 'ok', flagReason: 'API call failed' };
    }
}

/**
 * Main controller to create a new post, with content and image flagging.
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 */
const createPost = async (req, res) => {
    try {
        const { username, content, linkToPost } = req.body;
        const imageFile = req.file;

        let flagStatus = 'ok';
        let flagReasons = [];
        let associatedVIPs = [];
        let finalEmbedding = null;
        let finalImageHash = null;
        let sanitizedContent = content;
        
        const allVipsPromise = VIP.find({});
        const allPostsPromise = Post.find({}, 'embedding imageHash');
        const [allVips, allPosts] = await Promise.all([allVipsPromise, allPostsPromise]);

        // --- Step 1: Text-based analysis ---
        let vipMatch = null;
        const lowercaseContent = content.toLowerCase();
        for (const vip of allVips) {
            const nameVariations = [vip.name.toLowerCase(), ...vip.name.toLowerCase().split(' ')];
            const foundName = nameVariations.some(name => lowercaseContent.includes(name));
            const foundCommonWord = vip.commonWords.some(word => lowercaseContent.includes(word.toLowerCase()));

            if (foundName || foundCommonWord) {
                vipMatch = vip;
                if (!associatedVIPs.includes(vip._id)) {
                    associatedVIPs.push(vip._id);
                }
                
                if (foundName) {
                    flagReasons.push(`Direct mention of VIP: ${vip.name}`);
                }
                if (foundCommonWord) {
                    flagReasons.push(`Mention of VIP-related keyword for: ${vip.name}`);
                }

                if (vip.email && content.includes(vip.email)) {
                    flagReasons.push(`Email address of ${vip.name} shared, which could be misused.`);
                    const escapedEmail = escapeRegExp(vip.email);
                    sanitizedContent = sanitizedContent.replace(new RegExp(escapedEmail, 'g'), '[REDACTED]');
                }
                
                if (vip.phoneNumber && content.includes(vip.phoneNumber)) {
                    flagReasons.push(`Phone number related to VIP ${vip.name} found.`);
                    const escapedPhoneNumber = escapeRegExp(vip.phoneNumber);
                    sanitizedContent = sanitizedContent.replace(new RegExp(escapedPhoneNumber, 'g'), '[REDACTED]');
                }

                if (vip.dob && content.includes(vip.dob.toISOString().split('T')[0])) {
                    flagReasons.push(`Date of birth related to VIP ${vip.name} found.`);
                    const escapedDob = escapeRegExp(vip.dob.toISOString().split('T')[0]);
                    sanitizedContent = sanitizedContent.replace(new RegExp(escapedDob, 'g'), '[REDACTED]');
                }
            }
        }
        
        // --- Step 2: Call Python service for text embedding and content reuse check ---
        const existingEmbeddings = allPosts.map(p => p.embedding).filter(e => Array.isArray(e));
        const pythonResult = await checkContentWithPythonModel(content, existingEmbeddings);
        
        if (pythonResult.embedding) {
            finalEmbedding = pythonResult.embedding;
        }

        if (pythonResult.is_reused_content) {
            flagReasons.push('Content is a duplicate or very similar to a past post.');
        }

        // --- Step 3: Image analysis (NEW) ---
        if (imageFile) {
            const imageResult = await checkImageWithPythonModel(imageFile.buffer);
            
            if (imageResult && imageResult.phash) {
                finalImageHash = imageResult.phash;
                const isImageReused = allPosts.some(post => post.imageHash === finalImageHash);
                if (isImageReused) {
                    flagReasons.push('Image is a duplicate of a past post.');
                }
            }

            if (imageResult && imageResult.faces && imageResult.faces.length > 0) {
                for (const face of imageResult.faces) {
                    // Added a check to ensure we only process recognized VIPs and ignore 'unknown' or null values.
                    if (face.recognized_vip && face.recognized_vip.toLowerCase() !== 'unknown') {
                        const recognizedVip = allVips.find(v => v.name === face.recognized_vip);
                        if (recognizedVip && !associatedVIPs.includes(recognizedVip._id)) {
                            // Corrected logic: Push the VIP ID and a reason to the arrays
                            associatedVIPs.push(recognizedVip._id);
                            flagReasons.push(`VIP detected in image: ${recognizedVip.name}`);
                        }
                    }
                }
            }
        }

        // --- Step 4: Check content with Gemini for general harmfulness ---
        const geminiResult = await checkContentWithGemini(sanitizedContent);
        if (geminiResult.flagStatus === 'flagged') {
            let finalGeminiReason = geminiResult.flagReason;
            if (vipMatch && finalGeminiReason.includes('public figure')) {
                finalGeminiReason = finalGeminiReason.replace('a public figure', vipMatch.name);
                finalGeminiReason = finalGeminiReason.replace('public figure', vipMatch.name);
            }
            flagReasons.push(finalGeminiReason);
        }

        // --- Step 5: Finalize flag status and save the post ---
        if (flagReasons.length > 0) {
            flagStatus = 'flagged';
        } else {
            flagReasons.push('Content is clean.');
        }

        const newPost = new Post({
            username,
            content: sanitizedContent,
            linkToPost,
            flagStatus: flagStatus,
            flagReasons: flagReasons,
            associatedVIPs: associatedVIPs,
            imageHash: finalImageHash,
            embedding: finalEmbedding,
        });

        const post = await newPost.save();

        // --- Step 6: Update related models if the post was flagged ---
        if (flagStatus === 'flagged') {
            const updateObject = {
                $addToSet: { flaggedPostIds: post._id },
                $setOnInsert: { dateFirstFlagged: new Date() }
            };

            if (associatedVIPs.length > 0) {
                updateObject.$addToSet.associatedVIPs = { $each: associatedVIPs };
            }

            await FlaggedProfile.findOneAndUpdate(
                { username: post.username },
                updateObject,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (associatedVIPs.length > 0) {
                for (const vipId of associatedVIPs) {
                    const vip = await VIP.findByIdAndUpdate(
                        vipId,
                        { $addToSet: { flaggedPostIds: post._id } },
                        { new: true }
                    );

                    // --- NEW: send flag alert email ---
                    if (vip && vip.email) {
                        try {
                            await sendFlagAlertEmail(vip.email, linkToPost || content);
                            console.log(`Flag alert email sent to ${vip.email}`);
                        } catch (err) {
                            console.error(`Failed to send flag alert email to ${vip.email}`, err.message);
                        }
                    }
                }
            }
        }
        
        res.status(201).json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// /**
//  * Controller to get all posts (flagged and clean) from the database.
//  * The 'associatedVIPs' field is populated to show full VIP details.
//  * @param {object} req The Express request object.
//  * @param {object} res The Express response object.
//  */
// const getPosts = async (req, res) => {
//     try {
//         // Find all posts and populate the associated VIP details.
//         const posts = await Post.find({}).populate('associatedVIPs');
//         res.status(200).json(posts);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server error');
//     }
// };

// /**
//  * Controller to get all flagged profiles from the database.
//  * The 'associatedVIPs' and 'flaggedPostIds' are populated.
//  * @param {object} req The Express request object.
//  * @param {object} res The Express response object.
//  */
// const getFlaggedProfiles = async (req, res) => {
//     try {
//         // Find all flagged profiles and populate the associated VIPs and posts.
//         const profiles = await FlaggedProfile.find({})
//             .populate('associatedVIPs')
//             .populate('flaggedPostIds');
//         res.status(200).json(profiles);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server error');
//     }
// };



/**
 * Controller to get all posts (flagged and clean) for a specific VIP.
 * The 'associatedVIPs' field is populated to show full VIP details.
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 */
const getPosts = async (req, res) => {
    try {
        const { vipId } = req.query;
        let query = {};
        if (vipId) {
            query = { associatedVIPs: vipId };
        }
        
        // Find all posts and populate the associated VIP details.
        const posts = await Post.find(query).populate('associatedVIPs');
        res.status(200).json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

/**
 * Controller to get all flagged profiles for a specific VIP.
 * The 'associatedVIPs' and 'flaggedPostIds' are populated.
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 */
const getFlaggedProfiles = async (req, res) => {
    try {
        const { vipId } = req.query;
        let query = {};
        if (vipId) {
            query = { associatedVIPs: vipId };
        }
        
        // Find all flagged profiles and populate the associated VIPs and posts.
        const profiles = await FlaggedProfile.find(query)
            .populate('associatedVIPs')
            .populate('flaggedPostIds');
        res.status(200).json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { createPost ,getPosts, getFlaggedProfiles};
