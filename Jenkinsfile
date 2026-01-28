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
            post {
                success {
                    echo '✅ Stage Complete: Source code checked out successfully'
                }
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
            post {
                success {
                    echo '✅ Stage Complete: Backend Docker image built successfully'
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
            post {
                success {
                    echo '✅ Stage Complete: Frontend Docker image built successfully'
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
            post {
                success {
                    echo '✅ Stage Complete: Successfully logged in to DockerHub'
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
            post {
                success {
                    echo '✅ Stage Complete: Docker images pushed to DockerHub successfully'
                }
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
            post {
                success {
                    echo '✅ Stage Complete: Application deployed to Minikube successfully'
                }
            }
        }
        /* ==========================
           GET SERVICE URLS
        ========================== */
        stage('Get Service URLs') {
            steps {
                script {
                    echo '🔗 Retrieving service URLs...'
                    bat '''
                    echo.
                    echo ========================================
                    echo    APPLICATION ACCESS URLS
                    echo ========================================
                    echo.
                    echo Backend Service:
                    minikube service backend-service --url
                    echo.
                    echo Frontend Service:
                    minikube service frontend-service --url
                    echo.
                    echo ========================================
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Service URLs retrieved successfully'
                }
            }
        }
    }
    post {
        success {
            echo ''
            echo '================================================'
            echo '✅ PIPELINE COMPLETED SUCCESSFULLY'
            echo '================================================'
            echo 'All stages executed successfully!'
            echo 'Your application is now running on Minikube.'
            echo 'Check the console output above for service URLs.'
            echo '================================================'
        }
        failure {
            echo ''
            echo '================================================'
            echo '❌ PIPELINE FAILED'
            echo '================================================'
            echo 'Please check the logs above for error details.'
            echo '================================================'
        }
        always {
            echo ''
            echo 'Pipeline execution completed at: ' + new Date().toString()
        }
    }
}
