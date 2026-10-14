package com.crm.fieldvisit.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class GeoIpService {

    private final Map<String, String> ipCountryCache = new ConcurrentHashMap<>();

    @Getter
    public static class GeoCheckResult {
        private final boolean allowed;
        private final String countryCode;
        private final String countryName;
        private final String allowedRegions;

        public GeoCheckResult(boolean allowed, String countryCode, String countryName, String allowedRegions) {
            this.allowed = allowed;
            this.countryCode = countryCode;
            this.countryName = countryName;
            this.allowedRegions = allowedRegions;
        }
    }

    /**
     * Resolves the 2-letter ISO country code for a given client IP and request.
     */
    public String resolveCountryCode(String ip, HttpServletRequest request) {
        // 1. Check direct Cloudflare / Proxy headers
        if (request != null) {
            String cfCountry = request.getHeader("CF-IPCountry");
            if (cfCountry != null && !cfCountry.isBlank() && !"XX".equalsIgnoreCase(cfCountry)) {
                return cfCountry.trim().toUpperCase();
            }
            String xCountry = request.getHeader("X-Country-Code");
            if (xCountry != null && !xCountry.isBlank()) {
                return xCountry.trim().toUpperCase();
            }
            String simCountry = request.getHeader("X-Simulated-Country");
            if (simCountry != null && !simCountry.isBlank()) {
                return simCountry.trim().toUpperCase();
            }
        }

        if (ip == null || ip.isBlank() || isLocalOrPrivateIp(ip)) {
            // Local development defaults to IN (India)
            return "IN";
        }

        // 2. Check in-memory cache
        if (ipCountryCache.containsKey(ip)) {
            return ipCountryCache.get(ip);
        }

        // 3. Fast external GeoIP lookup with 2s timeout
        try {
            URL url = URI.create("https://ipapi.co/" + ip + "/country_code/").toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(2000);
            conn.setRequestProperty("User-Agent", "FieldVisitCRM/1.0");

            if (conn.getResponseCode() == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    String code = reader.readLine();
                    if (code != null && code.trim().length() == 2) {
                        String country = code.trim().toUpperCase();
                        ipCountryCache.put(ip, country);
                        return country;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for IP {}: {}", ip, e.getMessage());
        }

        // Default fallback
        ipCountryCache.put(ip, "IN");
        return "IN";
    }

    /**
     * Resolves country code from GPS coordinates based on bounding boxes.
     */
    public String resolveCountryFromCoordinates(Double lat, Double lon) {
        if (lat == null || lon == null) return null;
        if (lat >= 6.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0) return "IN";
        if (lat >= 22.0 && lat <= 26.5 && lon >= 51.0 && lon <= 56.5) return "AE";
        if (lat >= 24.0 && lat <= 50.0 && lon >= -125.0 && lon <= -65.0) return "US";
        if (lat >= 49.0 && lat <= 61.0 && lon >= -8.5 && lon <= 2.5) return "GB";
        if (lat >= 1.15 && lat <= 1.48 && lon >= 103.6 && lon <= 104.1) return "SG";
        if (lat >= -44.0 && lat <= -10.0 && lon >= 112.0 && lon <= 154.0) return "AU";
        if (lat >= 47.0 && lat <= 55.0 && lon >= 5.5 && lon <= 15.5) return "DE";
        if (lat >= 42.0 && lat <= 70.0 && lon >= -141.0 && lon <= -52.0) return "CA";
        return null;
    }

    /**
     * Evaluates whether a login attempt satisfies the employee's region restriction policy.
     */
    public GeoCheckResult evaluateRegionPolicy(String ip, Double lat, Double lon, HttpServletRequest request,
                                               Boolean isRegionRestricted, String allowedRegions) {
        String coordCountry = resolveCountryFromCoordinates(lat, lon);
        String detectedCountry = (coordCountry != null) ? coordCountry : resolveCountryCode(ip, request);
        String countryName = getCountryName(detectedCountry);

        if (isRegionRestricted == null || !isRegionRestricted || allowedRegions == null || allowedRegions.isBlank()) {
            return new GeoCheckResult(true, detectedCountry, countryName, "Any (Unrestricted)");
        }

        String[] allowedList = allowedRegions.split("[,;]");
        boolean isMatch = Arrays.stream(allowedList)
                .map(String::trim)
                .anyMatch(r -> r.equalsIgnoreCase(detectedCountry)
                        || r.equalsIgnoreCase(countryName)
                        || ("IN".equalsIgnoreCase(detectedCountry) && r.equalsIgnoreCase("India"))
                        || ("AE".equalsIgnoreCase(detectedCountry) && (r.equalsIgnoreCase("UAE") || r.equalsIgnoreCase("United Arab Emirates") || r.equalsIgnoreCase("Dubai")))
                        || ("US".equalsIgnoreCase(detectedCountry) && (r.equalsIgnoreCase("USA") || r.equalsIgnoreCase("United States"))));

        return new GeoCheckResult(isMatch, detectedCountry, countryName, allowedRegions);
    }

    public GeoCheckResult evaluateRegionPolicy(String ip, HttpServletRequest request,
                                               Boolean isRegionRestricted, String allowedRegions) {
        return evaluateRegionPolicy(ip, null, null, request, isRegionRestricted, allowedRegions);
    }

    public boolean isLocalOrPrivateIp(String ip) {
        if (ip == null) return true;
        return ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1")
                || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")
                || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.")
                || ip.startsWith("172.20.") || ip.startsWith("172.21.") || ip.startsWith("172.22.")
                || ip.startsWith("172.23.") || ip.startsWith("172.24.") || ip.startsWith("172.25.")
                || ip.startsWith("172.26.") || ip.startsWith("172.27.") || ip.startsWith("172.28.")
                || ip.startsWith("172.29.") || ip.startsWith("172.30.") || ip.startsWith("172.31.")
                || ip.equalsIgnoreCase("localhost");
    }

    public String getCountryName(String code) {
        if (code == null) return "Unknown Region";
        return switch (code.toUpperCase()) {
            case "IN" -> "India";
            case "US" -> "United States";
            case "GB", "UK" -> "United Kingdom";
            case "AE" -> "United Arab Emirates";
            case "SG" -> "Singapore";
            case "CA" -> "Canada";
            case "AU" -> "Australia";
            case "DE" -> "Germany";
            default -> code.toUpperCase();
        };
    }
}
