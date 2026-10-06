package com.crm.fieldvisit.repository;

import com.crm.fieldvisit.entity.TwoFactorVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TwoFactorVerificationRepository extends JpaRepository<TwoFactorVerification, Long> {

    Optional<TwoFactorVerification> findByVerificationTokenAndIsVerifiedFalse(String verificationToken);

    Optional<TwoFactorVerification> findTopByEmployeeIdOrderByCreatedAtDesc(Integer employeeId);

    void deleteByEmployeeId(Integer employeeId);
}
