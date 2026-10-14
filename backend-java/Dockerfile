# ===================================================================
# Stage 1: Build the Spring Boot JAR with Maven
# ===================================================================
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build the executable JAR
COPY src ./src
RUN mvn -B clean package -DskipTests

# ===================================================================
# Stage 2: Minimal Production JRE Runtime
# ===================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for container health checks and tzdata for timezone accuracy
RUN apk add --no-cache curl tzdata

# Create dedicated non-root application user and group
RUN addgroup -S crmgroup && adduser -S crmuser -G crmgroup

# Create persistent uploads directory structure and set ownership
RUN mkdir -p /app/uploads/visits && chown -R crmuser:crmgroup /app

# Copy executable jar from builder stage
COPY --from=builder --chown=crmuser:crmgroup /app/target/*.jar /app/app.jar

USER crmuser

ENV SERVER_PORT=4000 \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:4000/v3/api-docs || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
