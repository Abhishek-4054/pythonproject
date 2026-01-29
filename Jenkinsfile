pipeline {
    agent any
    
    environment {
        DOCKERHUB_USER = "abhishekc4054"
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/expense-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/expense-frontend:${BUILD_NUMBER}"
        BACKEND_LATEST = "${DOCKERHUB_USER}/expense-backend:latest"
        FRONTEND_LATEST = "${DOCKERHUB_USER}/expense-frontend:latest"
        
        // VM Configuration - UPDATE THESE VALUES
        VM_HOST = "192.168.130.131// e.g., "192.168.1.100"
        VM_USER = "abhishek4054 e.g., "ubuntu"
        K8S_MANIFESTS_PATH = "/home/${VM_USER}/k8s-manifests"
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
                bat """
                docker build -t %BACKEND_IMAGE% backend
                docker tag %BACKEND_IMAGE% %BACKEND_LATEST%
                """
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                echo 'Building Frontend Docker Image...'
                bat """
                docker build -t %FRONTEND_IMAGE% frontend
                docker tag %FRONTEND_IMAGE% %FRONTEND_LATEST%
                """
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
                    bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    """
                }
            }
        }
        
        stage('Push Images') {
            steps {
                echo 'Pushing Docker Images to Docker Hub...'
                bat """
                docker push %BACKEND_IMAGE%
                docker push %BACKEND_LATEST%
                docker push %FRONTEND_IMAGE%
                docker push %FRONTEND_LATEST%
                """
            }
        }
        
        stage('Update Kubernetes Manifests') {
            steps {
                echo 'Updating Kubernetes manifest files...'
                bat """
                powershell -Command "(Get-Content k8s\\backend-deployment.yaml) -replace 'IMAGE_BACKEND', '%BACKEND_LATEST%' | Set-Content k8s\\backend-deployment-updated.yaml"
                powershell -Command "(Get-Content k8s\\frontend-deployment.yaml) -replace 'IMAGE_FRONTEND', '%FRONTEND_LATEST%' | Set-Content k8s\\frontend-deployment-updated.yaml"
                """
            }
        }
        
        stage('Copy Manifests to VM') {
            steps {
                echo 'Copying Kubernetes manifests to VM...'
                script {
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'vm-ssh-credentials',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        bat """
                        ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "mkdir -p %K8S_MANIFESTS_PATH%"
                        
                        scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\backend-deployment-updated.yaml %SSH_USER%@%VM_HOST%:%K8S_MANIFESTS_PATH%/backend-deployment.yaml
                        scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\backend-service.yaml %SSH_USER%@%VM_HOST%:%K8S_MANIFESTS_PATH%/
                        scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\frontend-deployment-updated.yaml %SSH_USER%@%VM_HOST%:%K8S_MANIFESTS_PATH%/frontend-deployment.yaml
                        scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\frontend-service.yaml %SSH_USER%@%VM_HOST%:%K8S_MANIFESTS_PATH%/
                        """
                    }
                }
            }
        }
        
        stage('Deploy to VM Kubernetes') {
            steps {
                echo 'Deploying to Kubernetes on VM...'
                script {
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'vm-ssh-credentials',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        bat """
                        ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "kubectl apply -f %K8S_MANIFESTS_PATH%/backend-deployment.yaml && kubectl apply -f %K8S_MANIFESTS_PATH%/backend-service.yaml && kubectl apply -f %K8S_MANIFESTS_PATH%/frontend-deployment.yaml && kubectl apply -f %K8S_MANIFESTS_PATH%/frontend-service.yaml"
                        """
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying deployment...'
                script {
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'vm-ssh-credentials',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        bat """
                        ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "kubectl rollout status deployment/expense-backend --timeout=5m && kubectl rollout status deployment/expense-frontend --timeout=5m && echo '' && echo '======== DEPLOYMENTS ========' && kubectl get deployments && echo '' && echo '======== PODS ========' && kubectl get pods && echo '' && echo '======== SERVICES ========' && kubectl get services"
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '=========================================='
            echo 'Pipeline executed successfully!'
            echo 'Application deployed to VM Kubernetes'
            echo 'Frontend: http://%VM_HOST%:30000'
            echo 'Backend: http://%VM_HOST%:30001'
            echo '=========================================='
        }
        failure {
            echo '=========================================='
            echo 'Pipeline failed!'
            echo 'Check logs above for details'
            echo '=========================================='
        }
        always {
            bat 'docker image prune -f'
        }
    }
}