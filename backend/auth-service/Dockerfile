# ====== Build stage ======
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom trước để tận dụng cache dependency
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline

# Copy code nguồn và build
COPY src ./src
RUN mvn -q -DskipTests package

# ====== Run stage ======
FROM eclipse-temurin:21-jre 
WORKDIR /app

# Optimize JVM for containerized environments
# Set timezone to Vietnam (Asia/Ho_Chi_Minh = UTC+7)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+UseStringDeduplication -Duser.timezone=Asia/Ho_Chi_Minh"
ENV TZ=Asia/Ho_Chi_Minh

HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
    CMD wget -qO- http://localhost:8082/actuator/health | grep '"status":"UP"' || exit 1

COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

