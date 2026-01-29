pipeline {
    agent any

    environment {
        DOCKERHUB_USER    = "abhishekc4054"
        BACKEND_IMAGE     = "${DOCKERHUB_USER}/expense-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE    = "${DOCKERHUB_USER}/expense-frontend:${BUILD_NUMBER}"
        BACKEND_LATEST    = "${DOCKERHUB_USER}/expense-backend:latest"
        FRONTEND_LATEST   = "${DOCKERHUB_USER}/expense-frontend:latest"
        VM_HOST           = "192.168.130.131"
        VM_USER           = "abhishek4054"
        K8S_MANIFESTS_PATH = "/home/abhishek4054/k8s-manifests"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                bat "docker build -t %BACKEND_IMAGE% backend"
                bat "docker tag %BACKEND_IMAGE% %BACKEND_LATEST%"
            }
        }

        stage('Build Frontend') {
            steps {
                bat "docker build -t %FRONTEND_IMAGE% frontend"
                bat "docker tag %FRONTEND_IMAGE% %FRONTEND_LATEST%"
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'U', passwordVariable: 'P')]) {
                    bat "echo %P% | docker login -u %U% --password-stdin"
                }
            }
        }

        stage('Push Backend') {
            steps {
                bat "docker push %BACKEND_IMAGE%"
                bat "docker push %BACKEND_LATEST%"
            }
        }

        stage('Push Frontend') {
            steps {
                bat "docker push %FRONTEND_IMAGE%"
                bat "docker push %FRONTEND_LATEST%"
            }
        }

        stage('Prepare Manifests') {
            steps {
                // Image tags update karna YAML files mein
                bat """
                powershell -Command "(Get-Content k8s\\backend-deployment.yaml) -replace 'IMAGE_BACKEND', '%BACKEND_LATEST%' | Set-Content k8s\\backend-deployment-updated.yaml"
                powershell -Command "(Get-Content k8s\\frontend-deployment.yaml) -replace 'IMAGE_FRONTEND', '%FRONTEND_LATEST%' | Set-Content k8s\\frontend-deployment-updated.yaml"
                """
            }
        }

        stage('Copy to VM') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'vm-ssh-credentials', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    bat """
                    @echo off
                    :: Permission fix for Windows SSH
                    powershell -Command "\$p='%SSH_KEY%'; \$acl = Get-Acl \$p; \$acl.SetAccessRuleProtection(\$true, \$false); \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 'FullControl', 'Allow'); \$acl.AddAccessRule(\$rule); Set-Acl \$p \$acl"
                    
                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "mkdir -p ${K8S_MANIFESTS_PATH}"
                    
                    :: Updated files ko VM par copy karna
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\backend-deployment-updated.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/backend-deployment.yaml
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\backend-service.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\frontend-deployment-updated.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/frontend-deployment.yaml
                    scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no k8s\\frontend-service.yaml %SSH_USER%@%VM_HOST%:${K8S_MANIFESTS_PATH}/
                    """
                }
            }
        }

        stage('K8s Deploy') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'vm-ssh-credentials', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    bat """
                    @echo off
                    powershell -Command "\$p='%SSH_KEY%'; \$acl = Get-Acl \$p; \$acl.SetAccessRuleProtection(\$true, \$false); \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 'FullControl', 'Allow'); \$acl.AddAccessRule(\$rule); Set-Acl \$p \$acl"
                    
                    :: Apply commands
                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "kubectl apply -f ${K8S_MANIFESTS_PATH}/"
                    """
                }
            }
        }

        stage('Verify Rollout') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'vm-ssh-credentials', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    bat """
                    @echo off
                    powershell -Command "\$p='%SSH_KEY%'; \$acl = Get-Acl \$p; \$acl.SetAccessRuleProtection(\$true, \$false); \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 'FullControl', 'Allow'); \$acl.AddAccessRule(\$rule); Set-Acl \$p \$acl"
                    
                    :: Deployment status check karna (Correct names ke saath)
                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%VM_HOST% "kubectl rollout status deployment/expense-backend --timeout=2m && kubectl rollout status deployment/expense-frontend --timeout=2m && kubectl get pods"
                    """
                }
            }
        }
    }

    post {
        always {
            bat "docker image prune -f"
        }
        success {
            echo "Congratulations! Build #${env.BUILD_NUMBER} deployed successfully."
        }
    }
}