package com.edu.readle.repository;

import com.edu.readle.entity.EmailOtp;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

  @Query("select e from EmailOtp e " +
         "where e.email = :email and e.consumed = false " +
         "order by e.id desc")
  Optional<EmailOtp> findActiveByEmail(@Param("email") String email);

  @Modifying
  @Query("update EmailOtp e set e.consumed = true where e.email = :email and e.consumed = false")
  void consumeAllForEmail(@Param("email") String email);
}
