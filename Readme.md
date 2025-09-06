# VIPchakra 

VIPchakra is a solution that protects Very Important Persons (VIPs) from online threats and misinformation by using a full-stack application and machine learning.

## Tech Stack

**Frontend:** React, Tailwind CSS
**Backend:** Node.js, Express (MERN stack)
**Machine Learning / AI:**

* Python
* YOLO (object detection)
* DeepFace (face recognition)
* pHash (image hashing / similarity detection)
* Sentence-BERT (semantic similarity / NLP embeddings)
* Regex & Named Entity Recognition (NER) with spaCy

**Other Tools:** Various Python libraries for NLP, data processing, and threat detection


## How to Run

### Start the Frontend

```bash
cd frontend
npm run dev
```

### Start the Backend

```bash
cd backend
node server.js
```

### Start the ML Services

```bash
cd ml_services
uvicorn app:app --reload --port 8001
```

## VIP Registration and Dashboard

* **VIP Registration:** A VIP registers using an OTP-based authentication process.
* **Secure Details:** The VIP provides sensitive details and 3–5 high-quality images. This information is stored securely to enable the system's monitoring capabilities.
* **Personalized Dashboard:** Each registered VIP receives their own dashboard that provides a real-time feed of all flagged content and threats.


## Core Features

* **Reused Content & Old News Detection:** Identifies if old images or posts are being reposted by comparing content embeddings to prevent the spread of stale or misleading news.
* **VIP Recognition:** Detects VIPs in images using face recognition. The system can also flag multiple VIPs if found in the same content or image.
* **Sensitive Information Monitoring:** Flags content containing VIP-sensitive information leaks, wrong news, or direct threats.
* **Real-Time Monitoring:** The system continuously monitors posts on platforms like `x.news`. Any flagged content is immediately reflected on the VIP's dashboard.
* **Post Flagging:** Automatically flags suspicious posts and provides a clear reason for the flagging.
* **User Flagging:** Flags user accounts that consistently share problematic content.
* **Manual Report Button:** Allows users to report posts flagged incorrectly by the model.
* **Email Notifications:** The system sends an immediate email notification whenever flagged content or images related to a registered VIP are detected.

## Team

* [**Anshu P**](https://github.com/anshu2k24): Backend, ML services, threat detection, data analysis, overall architecture
* [**Dhruva Kr**](https://github.com/Dhruva-0812): Frontend, UI/UX, dashboard, visualization
