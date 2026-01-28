pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "abhishekc4054"
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/expense-backend:latest"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/expense-frontend:latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                bat '''
                docker build -t %BACKEND_IMAGE% backend
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                bat '''
                docker build -t %FRONTEND_IMAGE% frontend
                '''
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
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
                bat '''
                docker push %BACKEND_IMAGE%
                docker push %FRONTEND_IMAGE%
                '''
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                bat '''
                echo Updating image names...

                powershell -Command "(Get-Content k8s/backend-deployment.yaml) -replace 'IMAGE_BACKEND', '%BACKEND_IMAGE%' | Set-Content k8s/backend-deployment.yaml"
                powershell -Command "(Get-Content k8s/frontend-deployment.yaml) -replace 'IMAGE_FRONTEND', '%FRONTEND_IMAGE%' | Set-Content k8s/frontend-deployment.yaml"

                echo Done
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat '''
                kubectl apply -f k8s/backend-deployment.yaml
                kubectl apply -f k8s/backend-service.yaml
                kubectl apply -f k8s/frontend-deployment.yaml
                kubectl apply -f k8s/frontend-service.yaml
                '''
            }
        }
    }
}
