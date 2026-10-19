package ru.seoai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SeoArticleApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeoArticleApplication.class, args);
    }
}
