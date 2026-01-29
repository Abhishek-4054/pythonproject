pipeline {
    agent any

    environment {
        DOCKERHUB_USER    = "abhishekc4054"
        BACKEND_IMAGE     = "${DOCKERHUB_USER}/expense-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE    = "${DOCKERHUB_USER}/expense-frontend:${BUILD_NUMBER}"
        BACKEND_LATEST    = "${DOCKERHUB_USER}/expense-backend:latest"
        FRONTEND_LATEST   = "${DOCKERHUB_USER}/expense-frontend:latest"

        // VM Configuration
        VM_HOST = "192.168.130.131"
        VM_USER = "abhishek4054"
        K8S_MANIFESTS_PATH = "/home/${VM_USER}/k8s-manifests"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Build and Tag Images') {
            steps {
                bat """
                docker build -t %BACKEND_IMAGE% backend
                docker tag %BACKEND_IMAGE% %BACKEND_LATEST%
                docker build -t %FRONTEND_IMAGE% frontend
                docker tag %FRONTEND_IMAGE% %FRONTEND_LATEST%
                """
            }
        }

        stage('Docker Login & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    docker push %BACKEND_IMAGE%
                    docker push %BACKEND_LATEST%
                    docker push %FRONTEND_IMAGE%
                    docker push %FRONTEND_LATEST%
                    """
                }
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                bat """
                powershell -Command "(Get-Content k8s\\backend-deployment.yaml) -replace 'IMAGE_BACKEND', '%BACKEND_LATEST%' | Set-Content k8s\\backend-deployment-updated.yaml"
                powershell -Command "(Get-Content k8s\\frontend-deployment.yaml) -replace 'IMAGE_FRONTEND', '%FRONTEND_LATEST%' | Set-Content k8s\\frontend-deployment-updated.yaml"
                """
            }
        }

        stage('Copy Manifests to VM') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'vm-ssh-credentials',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    bat """
                    @echo off
                    :: Step 1: Fix Windows Permissions for SSH Key
                    powershell -Command "icacls '%SSH_KEY%' /inheritance:r; icacls '%SSH_KEY%' /grant '%USERNAME%:(F)'; icacls '%SSH_KEY%' /remove 'Users'; icacls '%SSH_KEY%' /remove 'Authenticated Users'"

                    :: Step 2: Run SSH/SCP commands
                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "mkdir -p ${K8S_MANIFESTS_PATH}"

                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\backend-deployment-updated.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/backend-deployment.yaml
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\backend-service.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\frontend-deployment-updated.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/frontend-deployment.yaml
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\frontend-service.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/
                    """
                }
            }
        }

        stage('Deploy to VM Kubernetes') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'vm-ssh-credentials',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    bat """
                    @echo off
                    :: Fix permissions again (for this specific session)
                    powershell -Command "icacls '%SSH_KEY%' /inheritance:r; icacls '%SSH_KEY%' /grant '%USERNAME%:(F)'; icacls '%SSH_KEY%' /remove 'Users'; icacls '%SSH_KEY%' /remove 'Authenticated Users'"

                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% " \
                        kubectl apply -f ${K8S_MANIFESTS_PATH}/backend-deployment.yaml && \
                        kubectl apply -f ${K8S_MANIFESTS_PATH}/backend-service.yaml && \
                        kubectl apply -f ${K8S_MANIFESTS_PATH}/frontend-deployment.yaml && \
                        kubectl apply -f ${K8S_MANIFESTS_PATH}/frontend-service.yaml \
                    "
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'vm-ssh-credentials',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    bat """
                    @echo off
                    :: Fix permissions again
                    powershell -Command "icacls '%SSH_KEY%' /inheritance:r; icacls '%SSH_KEY%' /grant '%USERNAME%:(F)'; icacls '%SSH_KEY%' /remove 'Users'; icacls '%SSH_KEY%' /remove 'Authenticated Users'"

                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% " \
                        kubectl rollout status deployment/expense-backend --timeout=5m && \
                        kubectl rollout status deployment/expense-frontend --timeout=5m && \
                        kubectl get pods && \
                        kubectl get services \
                    "
                    """
                }
            }
        }
    }

    post {
        success {
            echo "=========================================="
            echo "Pipeline executed successfully!"
            echo "Frontend: http://${VM_HOST}:30000"
            echo "Backend:  http://${VM_HOST}:30001"
            echo "=========================================="
        }
        failure {
            echo "Pipeline failed! Check logs for permission errors or network issues."
        }
        always {
            bat "docker image prune -f"
        }
    }
}