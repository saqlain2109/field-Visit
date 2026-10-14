package com.crm.fieldvisit.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "crm_opportunities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "opportunity_no", nullable = false, unique = true, length = 50)
    private String opportunityNo;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "customer_id", nullable = false)
    private Integer customerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    @Column(name = "contact_id")
    private Integer contactId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contact_id", insertable = false, updatable = false)
    private Contact contact;

    @Column(name = "is_new_client", nullable = false)
    @Builder.Default
    private Boolean isNewClient = false;

    @Column(name = "lead_source", length = 100)
    private String leadSource;

    @Column(length = 4000)
    private String requirement;

    @Column(length = 100)
    private String principal;

    @Column(name = "estimated_value", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal estimatedValue = BigDecimal.ZERO;

    @Column(name = "lead_date", nullable = false)
    private LocalDate leadDate;

    @Column(name = "expected_closure_date")
    private LocalDate expectedClosureDate;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "NEW_LEAD"; // NEW_LEAD, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST

    @Column(name = "salesperson_id")
    private Integer salespersonId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "salesperson_id", insertable = false, updatable = false)
    private Employee salesperson;

    @Column(name = "branch_id")
    private Integer branchId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "manager"})
    private Branch branch;

    @OneToMany(mappedBy = "opportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<OpportunityProduct> products = new ArrayList<>();

    @OneToMany(mappedBy = "opportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<OpportunityFollowUp> followUps = new ArrayList<>();

    // Competitor Intelligence Tracking
    @Column(name = "competitor_name", length = 150)
    private String competitorName;

    @Column(name = "competitor_model", length = 150)
    private String competitorModel;

    @Column(name = "competitor_price", precision = 14, scale = 2)
    private BigDecimal competitorPrice;

    @Column(name = "competitor_strengths", length = 4000)
    private String competitorStrengths;

    @Column(name = "competitor_weaknesses", length = 4000)
    private String competitorWeaknesses;

    @Column(name = "threat_level", length = 30)
    @Builder.Default
    private String threatLevel = "MEDIUM"; // LOW, MEDIUM, HIGH, DOMINANT

    @Column(name = "win_loss_reason", length = 4000)
    private String winLossReason;

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
