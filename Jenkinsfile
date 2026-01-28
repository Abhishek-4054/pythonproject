pipeline {
  agent any

  environment {
    DOCKERHUB = "yourdockerhubname"
    BACKEND_IMAGE = "${DOCKERHUB}/expense-backend"
    FRONTEND_IMAGE = "${DOCKERHUB}/expense-frontend"
  }

  stages {

    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/yourrepo.git'
      }
    }

    stage('Build Backend Image') {
      steps {
        sh 'docker build -t $BACKEND_IMAGE:latest -f backend/Dockerfile .'
      }
    }

    stage('Build Frontend Image') {
      steps {
        sh 'docker build -t $FRONTEND_IMAGE:latest -f frontend/Dockerfile .'
      }
    }

    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-cred',
          usernameVariable: 'USER',
          passwordVariable: 'PASS'
        )]) {
          sh 'echo $PASS | docker login -u $USER --password-stdin'
        }
      }
    }

    stage('Push Images') {
      steps {
        sh '''
          docker push $BACKEND_IMAGE:latest
          docker push $FRONTEND_IMAGE:latest
        '''
      }
    }

    stage('Deploy to Minikube') {
      steps {
        sh '''
          kubectl apply -f k8s/
          kubectl rollout status deployment/backend
          kubectl rollout status deployment/frontend
        '''
      }
    }
  }
}
