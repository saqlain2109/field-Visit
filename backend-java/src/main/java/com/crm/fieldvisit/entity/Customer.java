package com.crm.fieldvisit.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "customer_code", nullable = false, unique = true, length = 50)
    private String customerCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "customer_type", nullable = false, length = 50)
    @Builder.Default
    private String customerType = "Prospect";

    @Column(nullable = false, length = 100)
    private String industry;

    @Column(name = "contact_person_primary", length = 150)
    private String contactPersonPrimary;

    @Column(length = 100)
    private String source;

    @Column(length = 150)
    private String website;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "Active";

    @Column(length = 4000)
    private String remarks;

    @Column(length = 4000)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"customer", "hibernateLazyInitializer", "handler"})
    @Builder.Default
    private List<Contact> contacts = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    @Builder.Default
    private String createdBy = "SYSTEM";

    @Column(name = "updated_by", length = 100)
    @Builder.Default
    private String updatedBy = "SYSTEM";
}
