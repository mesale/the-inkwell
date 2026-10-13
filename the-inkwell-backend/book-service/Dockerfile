# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-21 AS build
# Force IPv4 for Maven downloads. WSL2/Docker here has no working IPv6 route,
# but Maven Central's Cloudflare DNS returns AAAA records too — without this,
# artifact downloads intermittently fail with "Network is unreachable".
ENV MAVEN_OPTS="-Djava.net.preferIPv4Stack=true"
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/book-service-*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
