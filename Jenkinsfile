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
           START MINIKUBE (if not running)
        ========================== */
        stage('Ensure Minikube Running') {
            steps {
                script {
                    bat '''
                    minikube status || minikube start
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Minikube is running'
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
                kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment
                kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment
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
                    echo '🔗 Retrieving service URLs...'
                    bat '''
                    @echo off
                    echo.
                    echo ========================================
                    echo    APPLICATION ACCESS URLS
                    echo ========================================
                    echo.
                    echo Backend Service:
                    minikube service backend-service --url 2>nul || kubectl get service backend-service -o jsonpath="{.spec.ports[0].nodePort}" && echo    URL: http://$(minikube ip):NodePort
                    echo.
                    echo Frontend Service:
                    minikube service frontend-service --url 2>nul || kubectl get service frontend-service -o jsonpath="{.spec.ports[0].nodePort}" && echo    URL: http://$(minikube ip):NodePort
                    echo.
                    echo ========================================
                    echo.
                    echo Alternative: Run these commands manually:
                    echo   minikube service backend-service --url
                    echo   minikube service frontend-service --url
                    echo ========================================
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Service URLs retrieved'
                }
                failure {
                    echo '⚠️  Could not auto-retrieve URLs. Please run manually:'
                    echo '   minikube service backend-service --url'
                    echo '   minikube service frontend-service --url'
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
            echo 'All stages executed successfully!'
            echo 'Your application is now running on Minikube.'
            echo ''
            echo 'To access your services, run:'
            echo '  minikube service backend-service --url'
            echo '  minikube service frontend-service --url'
            echo ''
            echo 'Or open in browser:'
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
            echo '================================================'
        }
        always {
            echo ''
            echo 'Pipeline execution completed at: ' + new Date().toString()
        }
    }
}
