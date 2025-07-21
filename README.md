# 🛡️ Insurance Underwriting Risk Dashboard Project

This project demonstrates a comprehensive data pipeline and visualization solution for analyzing **insurance underwriting risk**, using open government data from Qatar.

It includes:

- A **NestJS API** for data ingestion  
- **Google BigQuery** for scalable storage  
- **Google Looker Studio** for interactive dashboarding  
- Fully automated deployment using **Docker**, **GitHub Actions**, **Cloud Build**, and **Cloud Run**

---

## ## 1. Project Overview

The primary goal is to provide insights into various factors influencing underwriting risk, including:

- Real estate market trends  
- Road accident statistics  
- Environmental data (rainfall)  

By integrating these datasets, the dashboard helps insurance underwriters:

- Make more informed decisions  
- Identify high-risk areas  
- Understand correlations between risk indicators  

---

## ## 2. Architecture

The project follows a modern, cloud-native architecture with full CI/CD automation.

```mermaid
graph TD
    A[Qatar Government APIs] --> B(NestJS Data Ingestion API)
    B --> C[Google BigQuery]
    C --> D[Google Looker Studio]

    subgraph CI/CD Pipeline
        E[GitHub Repository] --> F[GitHub Actions]
        F --> G[Cloud Build]
        G --> H[Artifact Registry]
        H --> I[Cloud Run]
        I -- Deployed API --> B
    end
