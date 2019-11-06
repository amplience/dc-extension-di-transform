#!groovy
node('jnlp-slave-docker') {

  def region = 'eu-west-1'
  def repoSlug = 'dc-extension-di-transform'

  try {
    stage('Checkout') {
      checkout scm
    }

    parallel(
      "Build": {
        usingECR {
          insideImage('amplience/node-build-tools:10.13') {
            stage('Install Dependencies') {
              sshagent(credentials: ['bitbucket']) {
                sh 'mkdir -p ~/.ssh'
                sh 'ssh-keyscan -t rsa bitbucket.org >> ~/.ssh/known_hosts'
                sh 'npm config set unsafe-perm true && npm install'
              }
            }

            stage('Build App') {
              buildApp()
              archiveArtifacts artifacts: 'dist/dc-uiex-di', fingerprint: true, onlyIfSuccessful: true
            }
          }
        }
      }
    )

    parallel(
      "Upload to S3": {
        stage('App Publish S3') {
          def bucket = 'apps.dev-artifacts.adis.ws'
          def build = "${BRANCH_NAME}".replace("/", "-").replace("%2F", "-")
          def dir = "dc-extension-di-transform/${build}" // /${BUILD_NUMBER}"

          withAWS(credentials: 'aws-dev-jenkins-user-type', region: region) {
            s3Upload(file: 'dist/dc-uiex-di', bucket: bucket, path: dir)
          }

          def appUrl = "https://apps.dev-artifacts.adis.ws/${dir}/index.html"
          currentBuild.description = "Published App: <a href=\"${appUrl}\">${appUrl}</a>"
        }
      }
    )

  } catch (err) {
    throw err
  }
}

void usingECR(String url = "https://395026163603.dkr.ecr.eu-west-1.amazonaws.com",
              String credentials = "ecr:eu-west-1:aws-dev-jenkins",
              Closure<?> body) {
  docker.withRegistry(url, credentials, body)
}

void insideImage(String imageName, Closure<?> body) {
  def image = docker.image(imageName)
  image.pull()
  image.inside() {
    body()
  }
}

void buildApp(buildEnv = 'qa') {
  ansiColor('xterm') {
    def build = "${BRANCH_NAME}".replace("/", "-").replace("%2F", "-")
    def dir = "/" //"/dc-extension-di-transform/${build}"
    sh "npm run build"
  }
}
