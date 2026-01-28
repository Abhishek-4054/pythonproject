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
           CLEANUP & START MINIKUBE
        ========================== */
        stage('Setup Minikube') {
            steps {
                script {
                    bat '''
                    echo Cleaning up existing Minikube cluster...
                    minikube delete 2>nul || echo No existing cluster
                    
                    echo Starting fresh Minikube cluster...
                    minikube start --driver=docker --force
                    
                    echo Waiting for cluster to be ready...
                    timeout /t 30 /nobreak
                    
                    minikube status
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Minikube cluster is running'
                }
                failure {
                    echo '❌ Minikube failed to start. Check Docker Desktop is running.'
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
           WAIT FOR DEPLOYMENTS
        ========================== */
        stage('Wait for Deployments') {
            steps {
                bat '''
                echo Waiting for deployments to be ready...
                kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment 2>nul || echo Backend deployment check timed out
                kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment 2>nul || echo Frontend deployment check timed out
                '''
            }
            post {
                success {
                    echo '✅ Stage Complete: All deployments are ready'
                }
            }
        }
        /* ==========================
           GET SERVICE URLS
        ========================== */
        stage('Get Service URLs') {
            steps {
                script {
                    bat '''
                    @echo off
                    echo.
                    echo ========================================
                    echo    APPLICATION DEPLOYED SUCCESSFULLY
                    echo ========================================
                    echo.
                    echo Getting service URLs...
                    echo.
                    
                    echo Backend Service URL:
                    for /f "tokens=*" %%i in ('minikube service backend-service --url') do echo %%i
                    echo.
                    
                    echo Frontend Service URL:
                    for /f "tokens=*" %%i in ('minikube service frontend-service --url') do echo %%i
                    echo.
                    echo ========================================
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Service URLs retrieved'
                }
            }
        }
        /* ==========================
           DISPLAY SERVICE INFO
        ========================== */
        stage('Display Service Info') {
            steps {
                bat '''
                echo.
                echo ========================================
                echo    DEPLOYMENT STATUS
                echo ========================================
                kubectl get deployments
                echo.
                echo ========================================
                echo    SERVICES
                echo ========================================
                kubectl get services
                echo.
                echo ========================================
                echo    PODS
                echo ========================================
                kubectl get pods
                echo ========================================
                '''
            }
            post {
                success {
                    echo '✅ Stage Complete: Service information displayed'
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
            echo 'Your application is now running on Minikube!'
            echo ''
            echo 'Access your services using these commands:'
            echo '  minikube service backend-service --url'
            echo '  minikube service frontend-service --url'
            echo ''
            echo 'Or open directly in browser:'
            echo '  minikube service backend-service'
            echo '  minikube service frontend-service'
            echo '================================================'
        }
        failure {
            echo ''
            echo '================================================'
            echo '❌ PIPELINE FAILED'
            echo '================================================'
            echo 'Please check the logs above for error details.'
            echo ''
            echo 'Common fixes:'
            echo '1. Ensure Docker Desktop is running'
            echo '2. Try: minikube delete && minikube start'
            echo '3. Check if WSL2 is properly configured'
            echo '================================================'
        }
        always {
            echo ''
            echo 'Pipeline execution completed at: ' + new Date().toString()
        }
    }
}
