# syntax=docker/dockerfile:1

# Сборка jar. Кэш ~/.m2 переживает пересборки образа
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# На Windows git может отдать mvnw с CRLF - тогда скрипт не запустится
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY docs/openapi.yaml docs/
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --uid 1001 app
COPY --from=build /app/target/seo-article-ai-*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
