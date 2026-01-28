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
           UPDATE K8S MANIFESTS
        ========================== */
        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    bat '''
                    echo Updating Kubernetes manifests with correct image names...
                    
                    powershell -Command "(Get-Content k8s/backend-deployment.yaml) -replace 'yourdockerhubname/expense-backend:latest', '%BACKEND_IMAGE%' | Set-Content k8s/backend-deployment.yaml"
                    powershell -Command "(Get-Content k8s/frontend-deployment.yaml) -replace 'yourdockerhubname/expense-frontend:latest', '%FRONTEND_IMAGE%' | Set-Content k8s/frontend-deployment.yaml"
                    
                    echo Updated manifests:
                    type k8s\\backend-deployment.yaml
                    type k8s\\frontend-deployment.yaml
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Kubernetes manifests updated'
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
           SETUP MINIKUBE
        ========================== */
        stage('Setup Minikube') {
            steps {
                script {
                    bat '''
                    echo Checking Minikube status...
                    minikube status || (
                        echo Starting Minikube cluster...
                        minikube start --driver=docker --force
                    )
                    
                    echo Waiting for cluster to be ready...
                    timeout /t 20 /nobreak
                    
                    minikube status
                    '''
                }
            }
            post {
                success {
                    echo '✅ Stage Complete: Minikube cluster is running'
                }
            }
        }
        
        /* ==========================
           LOAD IMAGES TO MINIKUBE
        ========================== */
        stage('Load Images to Minikube') {
            steps {
                bat '''
                echo Loading Docker images into Minikube...
                minikube image load %BACKEND_IMAGE%
                minikube image load %FRONTEND_IMAGE%
                
                echo.
                echo Verifying images in Minikube:
                minikube ssh "docker images | grep abhishekc4054"
                '''
            }
            post {
                success {
                    echo '✅ Stage Complete: Images loaded into Minikube'
                }
            }
        }
        
        /* ==========================
           DEPLOY TO MINIKUBE
        ========================== */
        stage('Deploy to Minikube') {
            steps {
                bat '''
                echo Deploying applications to Kubernetes...
                kubectl apply -f k8s/backend-deployment.yaml
                kubectl apply -f k8s/backend-service.yaml
                kubectl apply -f k8s/frontend-deployment.yaml
                kubectl apply -f k8s/frontend-service.yaml
                
                echo.
                echo Kubernetes resources applied successfully!
                '''
            }
            post {
                success {
                    echo '✅ Stage Complete: Application deployed to Minikube'
                }
            }
        }
        
        /* ==========================
           MONITOR DEPLOYMENT
        ========================== */
        stage('Monitor Deployment') {
            steps {
                bat '''
                echo.
                echo ========================================
                echo    DEPLOYMENT PROGRESS
                echo ========================================
                echo.
                
                echo Waiting for pods to start (60 seconds)...
                timeout /t 60 /nobreak
                
                echo.
                echo Current Status:
                kubectl get all
                
                echo.
                echo Pod Details:
                kubectl get pods -o wide
                
                echo.
                echo Checking pod logs...
                for /f "tokens=1" %%p in ('kubectl get pods -l app=backend -o name 2^>nul') do kubectl logs %%p --tail=20 || echo Backend pod not ready yet
                for /f "tokens=1" %%p in ('kubectl get pods -l app=frontend -o name 2^>nul') do kubectl logs %%p --tail=20 || echo Frontend pod not ready yet
                
                echo ========================================
                '''
            }
            post {
                success {
                    echo '✅ Stage Complete: Deployment monitoring completed'
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
                    echo    SERVICE ACCESS URLS
                    echo ========================================
                    echo.
                    
                    echo Backend Service:
                    for /f "tokens=*" %%i in ('minikube service backend-service --url 2^>nul') do (
                        echo   URL: %%i
                        set BACKEND_URL=%%i
                    )
                    
                    echo.
                    echo Frontend Service:
                    for /f "tokens=*" %%i in ('minikube service frontend-service --url 2^>nul') do (
                        echo   URL: %%i
                        set FRONTEND_URL=%%i
                    )
                    
                    echo.
                    echo ========================================
                    echo    QUICK ACCESS COMMANDS
                    echo ========================================
                    echo   minikube service backend-service
                    echo   minikube service frontend-service
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
    }
    
    post {
        success {
            echo ''
            echo '╔════════════════════════════════════════════╗'
            echo '║   ✅ PIPELINE COMPLETED SUCCESSFULLY      ║'
            echo '╚════════════════════════════════════════════╝'
            echo ''
            echo '🚀 Your application is now running!'
            echo ''
            echo '📍 Access your services:'
            echo '   Backend:  minikube service backend-service'
            echo '   Frontend: minikube service frontend-service'
            echo ''
            echo '📊 Check status:'
            echo '   kubectl get all'
            echo '   kubectl get pods'
            echo '   minikube dashboard'
            echo ''
            echo '================================================'
        }
        failure {
            echo ''
            echo '╔════════════════════════════════════════════╗'
            echo '║   ❌ PIPELINE FAILED                       ║'
            echo '╚════════════════════════════════════════════╝'
            echo ''
            echo '🔍 Troubleshooting commands:'
            echo '   kubectl get pods'
            echo '   kubectl describe pods'
            echo '   kubectl logs <pod-name>'
            echo '   kubectl get events --sort-by=.metadata.creationTimestamp'
            echo ''
            echo '🔧 Quick fixes:'
            echo '   minikube delete && minikube start'
            echo '   kubectl delete -f k8s/ && kubectl apply -f k8s/'
            echo ''
            echo '================================================'
        }
        always {
            echo ''
            echo '⏰ Pipeline completed at: ' + new Date().toString()
            echo ''
        }
    }
}
