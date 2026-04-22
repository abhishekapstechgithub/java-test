# ---- Stage 1: Build the JAR with Maven ----
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml first so Maven dependencies are cached in a layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build (skip tests — tests run in Jenkins pipeline)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Stage 2: Slim runtime image ----
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/task-manager-backend-1.0.0.jar app.jar

EXPOSE 8080

# Pass DB creds at runtime via environment variables
ENTRYPOINT ["java", "-jar", "app.jar"]
