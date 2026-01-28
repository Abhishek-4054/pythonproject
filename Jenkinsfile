pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = 'abhishekc4054'
        BACKEND_IMAGE  = "${DOCKERHUB_USERNAME}/backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/frontend:latest"

        DOCKER_CREDS = 'dockerhub-credentials'
        GITHUB_CREDS = 'github-credentials'
    }

    stages {

        /* =========================
           CHECKOUT SOURCE
        ========================= */
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        /* =========================
           UPDATE K8S MANIFESTS
        ========================= */
        stage('Update Kubernetes Manifests') {
            steps {
                bat '''
                echo Updating image names in Kubernetes manifests...

                powershell -Command "(Get-Content k8s/backend-deployment.yaml) `
                    -replace 'yourdockerhubname/expense-backend:latest', '%BACKEND_IMAGE%' |
                    Set-Content k8s/backend-deployment.yaml"

                powershell -Command "(Get-Content k8s/frontend-deployment.yaml) `
                    -replace 'yourdockerhubname/expense-frontend:latest', '%FRONTEND_IMAGE%' |
                    Set-Content k8s/frontend-deployment.yaml"

                echo Manifests updated successfully
                '''
            }
        }

        /* =========================
           BUILD BACKEND IMAGE
        ========================= */
        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    bat 'docker build -t %BACKEND_IMAGE% .'
                }
            }
        }

        /* =========================
           BUILD FRONTEND IMAGE
        ========================= */
        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    bat 'docker build -t %FRONTEND_IMAGE% .'
                }
            }
        }

        /* =========================
           DOCKER LOGIN
        ========================= */
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

        /* =========================
           PUSH IMAGES
        ========================= */
        stage('Push Images') {
            steps {
                bat 'docker push %BACKEND_IMAGE%'
                bat 'docker push %FRONTEND_IMAGE%'
            }
        }

        /* =========================
           START / VERIFY MINIKUBE
        ========================= */
        stage('Setup Minikube') {
            steps {
                bat '''
                minikube status || (
                    echo Starting Minikube...
                    minikube start --driver=docker --force
                )
                '''
            }
        }

        /* =========================
           LOAD IMAGES INTO MINIKUBE
        ========================= */
        stage('Load Images to Minikube') {
            steps {
                bat '''
                echo Loading images into Minikube...
                minikube image load %BACKEND_IMAGE%
                minikube image load %FRONTEND_IMAGE%

                echo Images loaded successfully
                '''
            }
        }

        /* =========================
           DEPLOY TO KUBERNETES
        ========================= */
        stage('Deploy to Minikube') {
            steps {
                bat '''
                kubectl apply -f k8s/backend-deployment.yaml
                kubectl apply -f k8s/backend-service.yaml
                kubectl apply -f k8s/frontend-deployment.yaml
                kubectl apply -f k8s/frontend-service.yaml
                '''
            }
        }

        /* =========================
           MONITOR DEPLOYMENT
        ========================= */
        stage('Monitor Deployment') {
            steps {
                bat '''
                echo Waiting for pods...
                timeout /t 40 /nobreak

                kubectl get pods
                kubectl get svc
                '''
            }
        }

        /* =========================
           GET SERVICE URLS
        ========================= */
        stage('Get Service URLs') {
            steps {
                bat '''
                echo ===============================
                echo Backend URL:
                minikube service backend-service --url

                echo Frontend URL:
                minikube service frontend-service --url
                echo ===============================
                '''
            }
        }
    }

    post {
        success {
            echo '✅ PIPELINE COMPLETED SUCCESSFULLY'
            echo 'Run: minikube service frontend-service'
        }
        failure {
            echo '❌ PIPELINE FAILED'
            echo 'Check with: kubectl describe pod'
        }
    }
}
