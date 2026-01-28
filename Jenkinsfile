pipeline {
    agent any
    
    environment {
        DOCKERHUB_USER = "abhishekc4054"
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/expense-backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/expense-frontend:latest"
        KUBECONFIG     = "C:\\Windows\\System32\\config\\systemprofile\\.kube\\config"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Build Backend Image') {
            steps {
                echo 'Building Backend Docker Image...'
                bat '''
                docker build -t %BACKEND_IMAGE% backend
                '''
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                echo 'Building Frontend Docker Image...'
                bat '''
                docker build -t %FRONTEND_IMAGE% frontend
                '''
            }
        }
        
        stage('Docker Login') {
            steps {
                echo 'Logging into Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat '''
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    '''
                }
            }
        }
        
        stage('Push Images') {
            steps {
                echo 'Pushing Docker Images to Docker Hub...'
                bat '''
                docker push %BACKEND_IMAGE%
                docker push %FRONTEND_IMAGE%
                '''
            }
        }
        
        stage('Update Kubernetes Manifests') {
            steps {
                echo 'Updating Kubernetes manifest files with new image tags...'
                bat '''
                powershell -Command "(Get-Content k8s/backend-deployment.yaml) -replace 'IMAGE_BACKEND', '%BACKEND_IMAGE%' | Set-Content k8s/backend-deployment.yaml"
                powershell -Command "(Get-Content k8s/frontend-deployment.yaml) -replace 'IMAGE_FRONTEND', '%FRONTEND_IMAGE%' | Set-Content k8s/frontend-deployment.yaml"
                echo Manifest files updated successfully
                '''
            }
        }
        
        stage('Verify Kubernetes Connection') {
            steps {
                echo 'Verifying Kubernetes cluster connection...'
                bat '''
                set KUBECONFIG=%KUBECONFIG%
                kubectl cluster-info
                kubectl get nodes
                echo Kubernetes cluster is reachable
                '''
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                echo 'Deploying applications to Kubernetes cluster...'
                bat '''
                set KUBECONFIG=%KUBECONFIG%
                
                echo Applying backend deployment...
                kubectl apply -f k8s/backend-deployment.yaml
                
                echo Applying backend service...
                kubectl apply -f k8s/backend-service.yaml
                
                echo Applying frontend deployment...
                kubectl apply -f k8s/frontend-deployment.yaml
                
                echo Applying frontend service...
                kubectl apply -f k8s/frontend-service.yaml
                
                echo All manifests applied successfully
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying deployment status...'
                bat '''
                set KUBECONFIG=%KUBECONFIG%
                
                echo Waiting for backend deployment to roll out...
                kubectl rollout status deployment/expense-backend --timeout=5m
                
                echo Waiting for frontend deployment to roll out...
                kubectl rollout status deployment/expense-frontend --timeout=5m
                
                echo.
                echo ======================================
                echo Deployment Status:
                echo ======================================
                kubectl get deployments
                
                echo.
                echo ======================================
                echo Pods Status:
                echo ======================================
                kubectl get pods
                
                echo.
                echo ======================================
                echo Services:
                echo ======================================
                kubectl get services
                
                echo.
                echo Deployment verification completed successfully!
                '''
            }
        }
    }
    
    post {
        success {
            echo '======================================'
            echo 'Pipeline executed successfully!'
            echo 'All images built, pushed, and deployed'
            echo '======================================'
        }
        failure {
            echo '======================================'
            echo 'Pipeline failed!'
            echo 'Check the logs above for details'
            echo '======================================'
        }
        always {
            echo 'Cleaning up Docker images from Jenkins server...'
            bat '''
                docker image prune -f
            '''
        }
    }
}
