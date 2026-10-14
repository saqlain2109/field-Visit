package com.crm.fieldvisit.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "visit_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VisitExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    @JsonBackReference
    private DailyVisit visit;

    @Column(name = "visit_id", insertable = false, updatable = false)
    private Integer visitId;

    @Column(name = "expense_head_id", nullable = false)
    private Integer expenseHeadId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "expense_head_id", insertable = false, updatable = false)
    private ExpenseHead expenseHead;

    @Column(name = "day_start_km", precision = 10, scale = 2)
    private BigDecimal dayStartKm;

    @Column(name = "day_end_km", precision = 10, scale = 2)
    private BigDecimal dayEndKm;

    @Column(name = "total_km", precision = 10, scale = 2)
    private BigDecimal totalKm;

    @Column(name = "fuel_rate", precision = 10, scale = 2)
    private BigDecimal fuelRate;

    @Column(name = "toll_tax", precision = 10, scale = 2)
    private BigDecimal tollTax;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "attachment_url", length = 550)
    private String attachmentUrl;

    @Column(length = 4000)
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
