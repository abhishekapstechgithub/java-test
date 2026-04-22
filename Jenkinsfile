pipeline {

    agent any

    environment {
        DOCKER_HUB_CREDS = credentials('dockerhub-credentials')
        DOCKER_HUB_USER  = 'abhishekdevopstech'   // ← change this

        BACKEND_IMAGE  = "${DOCKER_HUB_USER}/taskmanager-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USER}/taskmanager-frontend"
        IMAGE_TAG      = 'latest'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Cloning repo..."
                checkout scm
            }
        }

        stage('Build & Test Backend') {
            steps {
                dir('backend') {
                    sh 'mvn clean install -B'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Backend Image') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ."
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ."
                        }
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    mkdir -p /opt/taskmanager
                    cp docker-compose.yml /opt/taskmanager/
                    cd /opt/taskmanager
                    docker compose up -d --remove-orphans
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo "SUCCESS — app is running at http://localhost:3000"
        }
        failure {
            echo "FAILED — check the console output above for errors"
        }
        always {
            sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG} || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true"
            cleanWs()
        }
    }
}