# VIPchakra README

## Introduction

VIPchakra is a solution that protects Very Important Persons (VIPs) from online threats and misinformation by using a full-stack application and machine learning.

-----

## Tech Stack

* **Frontend:** React, Tailwind CSS  
* **Backend:** Node.js, Express (MERN stack)  
* **Machine Learning / AI:** Python  
  * YOLO (object detection)  
  * DeepFace (face recognition)  
  * pHash (image hashing / similarity detection)  
  * Sentence-BERT (semantic similarity / NLP embeddings)  
  * Regex & Named Entity Recognition (NER) with spaCy  
* **Other Tools:** Various Python libraries for NLP, data processing, and threat detection  


-----

## How to Run

1. **Start the Frontend:**

    ```bash
    cd frontend
    npm run dev
    ```

2. **Start the Backend:**

    ```bash
    cd backend
    node server.js
    ```

3. **Start the ML Services:**

    ```bash
    cd ml_services
    uvicorn app:app --reload --port 8001
    ```

-----

## Core Features

VIPchakra primarily focuses on detecting and flagging threats to VIPs in content and images. Key functionalities include:

1. **Reused Content Detection:** Identifies if old images or posts are being reposted.  
2. **VIP Recognition:** Detects VIPs in images using face recognition.  
3. **Sensitive Information Monitoring:** Flags content containing VIP-sensitive information leaks.  
4. **Post Flagging:** Automatically flags suspicious posts and provides reasons for flagging.  
5. **User Flagging:** Flags user accounts that share problematic content.  
6. **Manual Report Button:** Allows users to report posts flagged incorrectly by the model.  

-----

## Team

* **Anshu P:** Backend, ML services, threat detection, data analysis, overall architecture  
* **Dhruva Kr:** Frontend, UI/UX, dashboard, visualization
