import io.clroot.gradle.bun.task.BunTask

plugins {
    id("com.android.library") version "8.7.3"
    id("org.jetbrains.dokka") version "2.2.0"
    id("io.deepmedia.tools.deployer") version "0.18.0"
    id("io.clroot.gradle-bun") version "0.1.0"
    kotlin("android") version "2.3.21"
}

group = "com.pedropathing"
version = property("version") as String

repositories {
    mavenCentral()
    maven("https://repo.dairy.foundation/releases/")
    google()
}

android {
    namespace = "com.pedropathing.tuning"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

dependencies {
    compileOnly("org.firstinspires.ftc:RobotCore:11.2.1")
    compileOnly("org.firstinspires.ftc:FtcCommon:11.2.1")
    compileOnly("org.firstinspires.ftc:RobotServer:11.2.1")
    dokkaPlugin("org.jetbrains.dokka:kotlin-as-java-plugin:2.2.0")
    implementation("com.pedropathing:revhub:3.0.0")
    implementation("dev.frozenmilk.sinister:Sloth:0.3.0")
    implementation("com.aventrix.jnanoid:jnanoid:2.0.0")
    implementation("org.nanohttpd:nanohttpd-websocket:2.3.1") {
        exclude(module = "nanohttpd")
    }
}

val dokkaJar = tasks.register<Jar>("dokkaJar") {
    description = "Generates a jar with the dokka documentation for the release"
    dependsOn(tasks.named("dokkaGenerate"))
    from(dokka.basePublicationsDirectory.dir("html"))
    archiveClassifier = "html-docs"
}

deployer {
    projectInfo {
        name = "Pedro Pathing AutoTune"
        description = "An automatic tuning system for Pedro Pathing"
        url = "https://pedropathing.com"
        scm {
            fromGithub("Pedro-Pathing", "AutoTune")
        }
        license("BSD 3-Clause License", "https://opensource.org/licenses/BSD-3-Clause")

        developer("Baron Henderson", "baron@pedropathing.com")
        developer("Havish Sripada", "havish@pedropathing.com")
        developer("Davis Luxenberg", "davis@pedropathing.com")
    }

    content {
        androidComponents("release") {
            docs(dokkaJar)
        }
    }

    if (System.getenv("PUBLISH_PEDRO") == "yes please") {
        signing {
            key = secret("MVN_GPG_KEY")
            password = secret("MVN_GPG_PASSWORD")
        }

        centralPortalSpec {
            auth {
                user = secret("SONATYPE_USERNAME")
                password = secret("SONATYPE_PASSWORD")
            }
            allowMavenCentralSync = false
        }

        nexusSpec("snapshot") {
            repositoryUrl = "https://central.sonatype.com/repository/maven-snapshots/"
            auth {
                user = secret("SONATYPE_USERNAME")
                password = secret("SONATYPE_PASSWORD")
            }
        }
    }

    localSpec()
}

val frontendDir = rootDir.parentFile.resolve("web-tuner")


bun {
    version = "1.4.0"
    workingDir = frontendDir
}

tasks.register<BunTask>("buildFrontend") {
    group = "build"
    description = "Builds the React frontend"

    dependsOn("bunInstall")

    args("run", "build")

    inputs.files(
        fileTree(frontendDir).exclude("node_modules/**")
    )

    outputs.dir(layout.projectDirectory.dir("src/main/assets/pedro"))
}

tasks.named("preBuild") {
    dependsOn("buildFrontend")
}
