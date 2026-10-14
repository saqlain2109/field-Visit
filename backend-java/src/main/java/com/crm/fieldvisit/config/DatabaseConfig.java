package com.crm.fieldvisit.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    @Value("${spring.datasource.hikari.maximum-pool-size:4}")
    private int maxPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:1}")
    private int minIdle;

    @Bean
    @Primary
    public DataSource dataSource() {
        String effectiveUrl = (databaseUrl != null && !databaseUrl.isBlank()) ? databaseUrl.trim() : datasourceUrl.trim();
        String effectiveUser = username != null ? username.trim() : "";
        String effectivePassword = password != null ? password.trim() : "";
        String effectiveDriver = driverClassName != null ? driverClassName.trim() : "";

        // Detect PostgreSQL (Cloud deployment on Render, Railway, Supabase, etc.)
        if (effectiveUrl.contains("postgres://") || effectiveUrl.contains("postgresql://") || effectiveUrl.contains("postgresql")) {
            log.info("Detected PostgreSQL connection. Parsing credentials and formatting JDBC URL...");

            try {
                // Strip jdbc: prefix if present for URI parsing
                String rawUri = effectiveUrl;
                if (rawUri.startsWith("jdbc:")) {
                    rawUri = rawUri.substring(5);
                }

                // If user:password@ is embedded in URL
                if (rawUri.contains("@")) {
                    URI uri = new URI(rawUri);
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath(); // e.g. /field_visit

                    if (uri.getUserInfo() != null) {
                        String[] userPass = uri.getUserInfo().split(":", 2);
                        effectiveUser = userPass[0];
                        if (userPass.length > 1) {
                            effectivePassword = userPass[1];
                        }
                    }

                    effectiveUrl = "jdbc:postgresql://" + host + ":" + port + path;
                } else if (!effectiveUrl.startsWith("jdbc:")) {
                    effectiveUrl = "jdbc:" + effectiveUrl;
                }

                // Append sslmode if not present
                if (!effectiveUrl.contains("sslmode")) {
                    effectiveUrl += (effectiveUrl.contains("?") ? "&" : "?") + "sslmode=require";
                }

                effectiveDriver = "org.postgresql.Driver";
                log.info("PostgreSQL clean JDBC URL: {}, user: {}", effectiveUrl, effectiveUser);
            } catch (Exception ex) {
                log.warn("URI parsing failed, applying regex fallback: {}", ex.getMessage());
                // Fallback regex: remove username:password@ from jdbc:postgresql://user:pass@host/db
                effectiveUrl = effectiveUrl.replaceAll("^(jdbc:)?(postgres|postgresql)://[^@]+@", "jdbc:postgresql://");
                effectiveDriver = "org.postgresql.Driver";
            }
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(effectiveUrl);

        if (!effectiveUser.isBlank()) {
            config.setUsername(effectiveUser);
        }
        if (!effectivePassword.isBlank()) {
            config.setPassword(effectivePassword);
        }
        if (!effectiveDriver.isBlank()) {
            config.setDriverClassName(effectiveDriver);
        }

        config.setMaximumPoolSize(maxPoolSize);
        config.setMinimumIdle(minIdle);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }
}
