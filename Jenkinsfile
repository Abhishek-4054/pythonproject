pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'abhishekc4054'
        BACKEND_IMAGE     = "${DOCKERHUB_USERNAME}/backend:latest"
        FRONTEND_IMAGE    = "${DOCKERHUB_USERNAME}/frontend:latest"

        DOCKER_CREDS = 'dockerhub-credentials'
        GITHUB_CREDS = 'github-credentials'
    }

    stages {

        /* ==========================
           SCM CHECKOUT (AUTO)
        ========================== */
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        /* ==========================
           BACKEND BUILD
        ========================== */
        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    bat 'docker build -t %BACKEND_IMAGE% .'
                }
            }
        }

        /* ==========================
           FRONTEND BUILD
        ========================== */
        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    bat 'docker build -t %FRONTEND_IMAGE% .'
                }
            }
        }

        /* ==========================
           DOCKER LOGIN
        ========================== */
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: DOCKER_CREDS,
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                }
            }
        }

        /* ==========================
           PUSH IMAGES
        ========================== */
        stage('Push Images') {
            steps {
                bat 'docker push %BACKEND_IMAGE%'
                bat 'docker push %FRONTEND_IMAGE%'
            }
        }

        /* ==========================
           DEPLOY TO MINIKUBE
        ========================== */
        stage('Deploy to Minikube') {
            steps {
                bat '''
                kubectl apply -f k8s/backend-deployment.yaml
                kubectl apply -f k8s/frontend-deployment.yaml
                kubectl apply -f k8s/backend-service.yaml
                kubectl apply -f k8s/frontend-service.yaml
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully'
        }
        failure {
            echo '❌ Pipeline failed'
        }
    }
}
