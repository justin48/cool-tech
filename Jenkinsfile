containerName='cool-tech'

// image config
def image = "cool-tech-image"
def registry = "justinoandrews.com:5000"
def imageTagName = "${registry}/${image}"
def versionNumber = null
def buildNumber = env.BUILD_NUMBER
def prodApprovalUsers = 'justin'

prodHost = "tcp://host.docker.internal:2375"

pipeline {
    agent any

    stages {
        stage('Build Binaries') {
            steps {
                echo 'Building Binaries'
                sh 'npm install'
                sh 'npx remix build'
            }
        }
        stage('Build Prisma Database') {
            steps {
                sh 'npx prisma init --url file:./data.db'
                sh 'npx prisma db push'
                sh 'npx prisma generate'
            }
        }
        stage('Build Docker Image') {
            steps {
                echo 'Building....'
                dockerBuild('prod', "${buildNumber}", "${imageTagName}")
                cleanIntermediateImages()
            }
        }
        stage('Test') {
            steps {
                echo 'Testing....'
                echo 'I wish I had tests'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
                deployment('prod', "${buildNumber}", "${imageTagName}", "cool-tech-ui", "${prodHost}")
            }
        }
    }
}

def dockerBuild(env, buildNumber, imageTagName) {
    versionNumber = getLatestVersionTag()
    sh "docker build -t ${imageTagName}-${env}:${versionNumber}.${buildNumber} ."
}

def deployment(env, buildNumber, imageTagName, containerName, host) {
    undeploy(containerName)
    sh "docker run --restart=always -d -p 3005:3000 --name ${containerName} ${imageTagName}-${env}:${versionNumber}.${buildNumber}"
}

def undeploy(containerName) {
    try {
        sh "docker stop ${containerName}"
        sh "docker rm ${containerName}"
    } catch (e) {
        echo "No Docker containers were removed. Error: ${e.getMessage()}"
    }
}

def cleanIntermediateImages() {
    try {
        sh 'docker rmi $(docker images -f "dangling=true" -q)'
    } catch (e) {
        echo "Had trouble deleting all unnecessary intermediary docker images. Error message: ${e.getMessage()} \nError: ${e}"
    }
}

def getLatestVersionTag() {
    sh 'git describe --abbrev=0 --tags | tee versionTag'
    def versionTag = readFile('versionTag').trim()
    return versionTag
}
