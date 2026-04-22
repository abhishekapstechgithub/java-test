// ============================================================
//  Jenkinsfile — Task Manager CI/CD Pipeline
//  Runs on every push to main branch via GitHub webhook
// ============================================================

pipeline {

    // Run on any available Jenkins agent
    agent any

    // ---- Global environment variables ----
    environment {
        // Docker Hub credentials stored in Jenkins Credentials Manager
        DOCKER_HUB_CREDS = credentials('dockerhub-credentials')   // id you set in Jenkins
        DOCKER_HUB_USER  = 'yourdockerhubuser'                     // replace with your Docker Hub username

        // Image names
        BACKEND_IMAGE  = "${DOCKER_HUB_USER}/taskmanager-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USER}/taskmanager-frontend"

        // Tag every image with the short Git commit SHA for traceability
        IMAGE_TAG = "${env.GIT_COMMIT?.take(7) ?: 'latest'}"

        // SSH credentials to the deployment server (set in Jenkins)
        DEPLOY_SERVER_CREDS = credentials('deploy-server-ssh')
        DEPLOY_SERVER_HOST  = 'your.server.ip.or.hostname'
        DEPLOY_SERVER_USER  = 'ubuntu'
        DEPLOY_DIR          = '/opt/taskmanager'
    }

    // ---- Trigger: build whenever main branch changes ----
    triggers {
        githubPush()   // requires GitHub plugin + webhook configured in GitHub repo
    }

    // ---- Pipeline options ----
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))   // keep last 10 builds
        timeout(time: 30, unit: 'MINUTES')               // fail if pipeline hangs
        timestamps()                                     // timestamps in console log
    }

    stages {

        // ----------------------------------------------------------
        // STAGE 1 — Checkout
        // Jenkins clones your GitHub repo here automatically because
        // the Jenkinsfile lives in the repo root.
        // ----------------------------------------------------------
        stage('Checkout') {
            steps {
                echo "Checking out branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        // ----------------------------------------------------------
        // STAGE 2 — Build & Test (Java)
        // Maven compiles the code, runs JUnit tests, and produces
        // the fat JAR. Tests use H2 in-memory DB (no MySQL needed).
        // ----------------------------------------------------------
        stage('Build & Test Backend') {
            steps {
                dir('backend') {
                    sh 'mvn clean install -B'
                    // -B = batch mode (no interactive prompts, cleaner CI logs)
                }
            }
            post {
                always {
                    // Publish JUnit test results in Jenkins UI
                    junit 'backend/target/surefire-reports/*.xml'
                }
                failure {
                    echo 'Tests FAILED — stopping pipeline'
                }
            }
        }

        // ----------------------------------------------------------
        // STAGE 3 — Build Docker images
        // We build both images in parallel to save time.
        // ----------------------------------------------------------
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('backend') {
                            sh """
                                docker build \
                                  -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                                  -t ${BACKEND_IMAGE}:latest \
                                  .
                            """
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build \
                                  -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                  -t ${FRONTEND_IMAGE}:latest \
                                  .
                            """
                        }
                    }
                }
            }
        }

        // ----------------------------------------------------------
        // STAGE 4 — Push to Docker Hub
        // Jenkins logs in using the stored credentials, pushes both
        // tags (commit SHA + latest), then logs out.
        // ----------------------------------------------------------
        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh """
                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:latest
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:latest
                """
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }

        // ----------------------------------------------------------
        // STAGE 5 — Deploy to server
        // Jenkins SSHes into the deployment server, copies the latest
        // docker-compose.yml, pulls the new images, and restarts
        // containers with zero-downtime rolling update.
        // ----------------------------------------------------------
        stage('Deploy') {
            steps {
                // Copy docker-compose.yml to the deployment server
                sh """
                    scp -o StrictHostKeyChecking=no \
                        docker-compose.yml \
                        ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST}:${DEPLOY_DIR}/docker-compose.yml
                """

                // SSH in and run the deployment commands
                sh """
                    ssh -o StrictHostKeyChecking=no \
                        ${DEPLOY_SERVER_USER}@${DEPLOY_SERVER_HOST} \
                        '
                        cd ${DEPLOY_DIR}

                        # Set the image tag so compose uses the right version
                        export IMAGE_TAG=${IMAGE_TAG}
                        export DOCKER_HUB_USER=${DOCKER_HUB_USER}

                        # Pull latest images from Docker Hub
                        docker compose pull

                        # Restart containers (only recreates containers whose image changed)
                        docker compose up -d --remove-orphans

                        # Clean up old dangling images
                        docker image prune -f
                        '
                """
            }
        }

        // ----------------------------------------------------------
        // STAGE 6 — Smoke test (optional but recommended)
        // Hits the /health endpoint after deployment to confirm the
        // backend came up correctly.
        // ----------------------------------------------------------
        stage('Smoke Test') {
            steps {
                sh """
                    sleep 15   # give containers time to start
                    curl --fail http://${DEPLOY_SERVER_HOST}:8080/api/tasks/health \
                         && echo 'Backend health check PASSED'
                """
            }
        }
    }

    // ---- Post-pipeline notifications ----
    post {
        success {
            echo "Pipeline SUCCEEDED — image tag: ${IMAGE_TAG}"
            // Uncomment to send email:
            // mail to: 'team@yourcompany.com',
            //      subject: "BUILD PASSED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            //      body: "Deployed image tag ${IMAGE_TAG}. See ${env.BUILD_URL}"
        }
        failure {
            echo 'Pipeline FAILED'
            // mail to: 'team@yourcompany.com',
            //      subject: "BUILD FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            //      body: "Check console at ${env.BUILD_URL}"
        }
        always {
            // Remove local Docker images to keep disk clean on the Jenkins agent
            sh """
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
            """
            cleanWs()   // wipe workspace after every build
        }
    }
}
