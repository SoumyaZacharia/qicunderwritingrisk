Insurance Underwriting Risk Dashboard Project
This project demonstrates a comprehensive data pipeline and visualization solution for analyzing insurance underwriting risk, leveraging open government data from Qatar. The solution involves a NestJS API for data ingestion, Google BigQuery for robust data storage, and Google Looker Studio for interactive dashboarding, all deployed and automated using Docker, GitHub Actions, Cloud Build, and Cloud Run.

1. Project Overview
The primary goal of this project is to provide insights into various factors influencing insurance underwriting risk, including real estate market trends, road accident statistics, and environmental data (rainfall). By integrating these diverse datasets, the dashboard aims to assist insurance underwriters in making more informed decisions, identifying high-risk areas, and understanding potential correlations between different risk indicators.

2. Architecture
The project follows a modern cloud-native architecture, designed for scalability, maintainability, and automated deployment:

graph TD
    A[Qatar Government APIs] --> B(NestJS Data Ingestion API);
    B --> C[Google BigQuery];
    C --> D[Google Looker Studio];
    
    subgraph CI/CD Pipeline
        E[GitHub Repository] --> F[GitHub Actions];
        F --> G[Cloud Build];
        G --> H[Artifact Registry];
        H --> I[Cloud Run];
        I -- Deployed API --> B;
    end

Data Sources: Public APIs from the Qatar government provide the raw data.

Data Ingestion API (NestJS): A NestJS application acts as an intermediary, fetching data from the APIs, transforming it, and loading it into BigQuery. This API is exposed via a POST endpoint.

Google BigQuery: A fully-managed, serverless data warehouse used for storing structured and semi-structured data from the ingestion API. It provides a scalable and performant analytics engine.

Google Looker Studio: A free, cloud-based data visualization tool connected directly to BigQuery, used to create interactive dashboards for risk analysis.

Deployment Pipeline (CI/CD):

GitHub Repository: Hosts the NestJS application code and GitHub Actions workflow.

GitHub Actions: Automates the build and deployment process upon code pushes to the main branch.

Cloud Build: Triggered by GitHub Actions, it builds the Docker image of the NestJS application.

Artifact Registry: Stores the built Docker container image.

Cloud Run: A fully-managed serverless platform for deploying containerized applications. It hosts the NestJS Data Ingestion API.

3. Data Sources
The dashboard integrates data from three key government API links, providing diverse perspectives on underwriting risk:

Real Estate News: Provides details on property transactions, including contract dates, municipality, zone, real estate type, area, price per square foot, and total value. Crucially, it includes geo_point_2d for spatial analysis.

Schema:

[
  { "name": "date_of_contract", "type": "DATE" },
  { "name": "municipality_name", "type": "STRING" },
  { "name": "sm_lbldy", "type": "STRING" },
  { "name": "zone_name", "type": "STRING" },
  { "name": "sm_lmntq", "type": "STRING" },
  { "name": "real_estate_type", "type": "STRING" },
  { "name": "nw_l_qr", "type": "STRING" },
  { "name": "area_in_square_meters", "type": "FLOAT" },
  { "name": "price_per_square_foot", "type": "FLOAT" },
  { "name": "real_estate_value", "type": "FLOAT" },
  {
    "name": "geo_point_2d",
    "type": "RECORD",
    "mode": "NULLABLE",
    "fields": [
      { "name": "lon", "type": "FLOAT" },
      { "name": "lat", "type": "FLOAT" }
    ]
  }
]

Road Accidents: Contains information on road incidents, including the year, result of the accident (e.g., injury, fatality), and the number of people involved.

Schema:

[
  { "name": "year", "type": "STRING" },
  { "name": "result_of_the_accident", "type": "STRING" },
  { "name": "number_of_people", "type": "INTEGER" },
  { "name": "result_of_the_accident_ar", "type": "STRING" }
]

Rainfall Data: Provides annual rainfall amounts per station, with years as individual columns.

Original Schema (Pivoted):

[
  { "name": "2016", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "2017", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "2018", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "2019", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "2020", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "2021", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "station", "type": "STRING", "mode": "NULLABLE" }
]

Transformed Schema (Unpivoted in BigQuery for analysis):

[
  { "name": "station", "type": "STRING" },
  { "name": "year", "type": "BIGNUMERIC" },
  { "name": "rainfall_amount", "type": "FLOAT" }
]

4. Data Ingestion (NestJS API)
A NestJS application serves as the data ingestion layer. It's responsible for:

Fetching data from the specified Qatar government API endpoints.

Applying any necessary data transformations or cleaning.

Defining the schema for each dataset as per the BigQuery requirements.

Using the @google-cloud/bigquery Node.js client library to efficiently stream or batch insert data into the respective BigQuery tables.

The API exposes POST endpoints (e.g., /ingest-real-estate, /ingest-road-accidents, /ingest-rainfall) to trigger data loads.

BigQuery Client Definition & Authentication
The NestJS application leverages Application Default Credentials (ADC) for authentication with BigQuery, ensuring secure and flexible deployment:

Local Development:

The BigQuery client is initialized without explicit credentials.

Authentication relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable, which points to a local service account key file. This key file is kept secure and not committed to the repository.

Environment variables like BIGQUERY_PROJECT_ID, BIGQUERY_DATASET_ID, and BIGQUERY_TABLE_ID are read from a local .env file.

Cloud Run Environment:

The BigQuery client definition remains the same (no explicit key file).

Cloud Run automatically uses the service account attached to the Cloud Run service instance for authentication. This service account is granted the necessary BigQuery IAM roles (e.g., BigQuery Data Editor, BigQuery Job User).

Environment variables (BIGQUERY_PROJECT_ID, BIGQUERY_DATASET_ID, BIGQUERY_TABLE_ID) are configured directly on the Cloud Run service via the GitHub Actions workflow or the GCP Console.

This approach simplifies credential management and enhances security by avoiding hardcoded keys in the application code.

5. Data Storage (Google BigQuery)
BigQuery serves as the central data warehouse.

Schema Definition: Precise schemas are defined for each table (real_estate_news, road_accidents, rainfall_data) to ensure data integrity and optimize querying.

Data Transformation (Rainfall): The raw rainfall data, initially in a pivoted format (years as columns), is transformed into an unpivoted (long) format within BigQuery using the UNPIVOT SQL clause. This enables easier time-series analysis and blending with other datasets.

6. Data Visualization (Google Looker Studio)
Google Looker Studio is used to create an interactive dashboard that connects directly to the BigQuery tables. The dashboard provides:

Property Risk Overview: Visualizations of real estate value distribution, price per square foot by type, and transaction trends.

Regional Risk Analysis: Maps and charts showing combined risk factors (real estate value, accident density, rainfall patterns) by municipality or zone.

Accident & Safety Risk: Breakdown of accident outcomes, casualties, and historical accident trends.

Time-Series Trends: Dual-axis charts to explore correlations between real estate activity, accidents, and rainfall over time.

7. Deployment Pipeline
The entire deployment process for the NestJS Data Ingestion API is automated using GitHub Actions and Google Cloud services.

Docker Container Image Generation:

A Dockerfile is defined in the project root, utilizing a multi-stage build pattern.

The build stage installs all npm dependencies (including devDependencies like @nestjs/cli) to compile the NestJS application. This ensures the nest build command runs successfully.

The production stage creates a lean, optimized Docker image by copying only the compiled application code (dist folder) and production-only node_modules from the build stage.

GitHub Actions:

A workflow (.github/workflows/deploy.yml) is configured to trigger on pushes to the main branch.

It authenticates with GCP using a securely stored Service Account Key.

It configures Docker to push images to Google Artifact Registry.

Cloud Build:

Implicitly used by the google-github-actions/deploy-cloudrun action when deploying from a Docker image.

It orchestrates the Docker build process defined in the Dockerfile.

Artifact Registry:

The built Docker image is pushed to a dedicated Docker repository in Google Artifact Registry.

Cloud Run:

The google-github-actions/deploy-cloudrun action deploys the container image from Artifact Registry to a new revision of the Cloud Run service.

Crucially, the workflow explicitly sets the no_allow_unauthenticated: true flag during deployment (if the API is public-facing), allowing external clients (like Postman) to access the API without requiring an Authorization header.

8. Setup and Usage
Prerequisites:
Google Cloud Platform (GCP) Project with billing enabled.

Google Cloud SDK (gcloud CLI) installed and configured locally.

Node.js and npm installed locally.

Docker installed locally.

A GitHub repository for your NestJS application.

Local Development:
Clone the repository.

Ensure your src/main.ts uses process.env.PORT and listens on 0.0.0.0.

Create a .env file in your project root with BIGQUERY_PROJECT_ID, BIGQUERY_DATASET_ID, BIGQUERY_TABLE_ID, and GOOGLE_APPLICATION_CREDENTIALS pointing to your local GCP service account key JSON file.

Install dependencies: npm install

Run the app: npm run start:dev

GCP Setup (One-time):
Enable Cloud Run, Cloud Build, and Artifact Registry APIs in your GCP project.

Create a Docker repository in Artifact Registry (e.g., nestjs-app-repo).

Create a GCP Service Account (e.g., github-actions-deployer) with Artifact Registry Writer, Cloud Run Admin, Service Account User, and Cloud Build Editor roles.

Generate and download a JSON key for this service account.

In your GitHub repository settings, add the following secrets: GCP_PROJECT_ID, GCP_REGION, GCP_ARTIFACT_REGISTRY_REPO, CLOUD_RUN_SERVICE_NAME, and GCP_SA_KEY (paste the content of the JSON key).

Deployment:
Ensure your Dockerfile and .github/workflows/deploy.yml files match the provided configurations in this README.

Commit and push your changes to the main branch of your GitHub repository.

Monitor the "Actions" tab in your GitHub repository for the workflow run status.

Once the workflow completes, navigate to the Cloud Run services page in the GCP Console to find your deployed API's URL.

API Usage (Postman/cURL):
The deployed NestJS Data Ingestion API can be called using POST requests to its respective endpoints (e.g., https://your-cloud-run-url.run.app/ingest-real-estate). The request body should contain the data to be ingested, matching the expected BigQuery table schema.

Example (assuming no_allow_unauthenticated: true):

curl -X POST "https://your-cloud-run-url.run.app/ingest-real-estate" \
-H "Content-Type: application/json" \
-d '[
  {
    "date_of_contract": "2023-01-15",
    "municipality_name": "Doha",
    "sm_lbldy": "SomeBuilding",
    "zone_name": "Zone 1",
    "sm_lmntq": "SomeArea",
    "real_estate_type": "Apartment",
    "nw_l_qr": "SomeQR",
    "area_in_square_meters": 120.5,
    "price_per_square_foot": 100.0,
    "real_estate_value": 1296000.0,
    "geo_point_2d": { "lon": 51.5310, "lat": 25.2854 }
  }
]'

9. Future Enhancements
Error Handling & Retries: Implement more robust error handling and retry mechanisms for API calls and BigQuery insertions.

Data Validation: Add comprehensive validation (e.g., using NestJS Pipes and DTOs) for incoming data to ensure it conforms to BigQuery schemas.

Authentication for API: If the ingestion API needs to be private, implement API key or OAuth2 authentication for the /ingest endpoints.

Scheduled Ingestion: Use Cloud Scheduler and Cloud Pub/Sub to trigger the NestJS API on a schedule for automated data refreshes.

Advanced Analytics: Explore BigQuery ML for predictive modeling (e.g., predicting risk scores based on historical data).

More Data Sources: Integrate additional relevant data (e.g., demographic data, weather forecasts, crime statistics) to enrich risk analysis.

Custom Looker Studio Dashboards: Develop more specialized dashboards for different insurance product lines (e.g., auto, home, health).
